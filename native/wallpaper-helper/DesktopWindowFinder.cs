namespace WallpaperHelper;

internal static class DesktopWindowFinder
{
    internal static DesktopDiscoveryResult FindDesktop(string helperVersion, string command)
    {
        var result = new DesktopDiscoveryResult
        {
            Command = command,
            HelperVersion = helperVersion,
            Attached = false,
            DryRun = command == "attach",
            PrimaryScreenRect = Win32.GetPrimaryScreenRect(),
            VirtualScreenRect = Win32.GetVirtualScreenRect(),
        };

        if (!OperatingSystem.IsWindows())
        {
            result.Ok = false;
            result.Reason = "unsupported_platform";
            result.Errors.Add("Desktop discovery is only available on Windows.");
            return result;
        }

        var progman = Win32.FindWindow("Progman", null);
        result.ProgmanFound = progman != IntPtr.Zero;
        result.ProgmanHwnd = result.ProgmanFound ? Win32.HwndToString(progman) : null;
        if (result.ProgmanFound)
        {
            var shellDllDefView = Win32.FindDescendantWindow(progman, "SHELLDLL_DefView");
            var sysListView32 = shellDllDefView == IntPtr.Zero
                ? Win32.FindDescendantWindow(progman, "SysListView32")
                : Win32.FindDescendantWindow(shellDllDefView, "SysListView32");
            result.ShellDllDefViewHwnd = Win32.HwndToNullableString(shellDllDefView);
            result.SysListView32Hwnd = Win32.HwndToNullableString(sysListView32);
            result.ProgmanCandidate = CreateCandidate(
                result,
                progman,
                Win32.GetClassNameSafe(progman),
                shellDllDefView != IntPtr.Zero,
                "progman_desktop_shell_candidate");
            result.ProgmanHasShellDllDefView = result.ProgmanCandidate.HasShellDllDefViewDescendant;
            result.ProgmanHasSysListView32 = result.ProgmanCandidate.HasSysListView32;
            result.ProgmanCoversPrimaryScreen =
                result.ProgmanCandidate.CoversPrimaryScreen ||
                result.ProgmanCandidate.MatchesPrimaryScreen;
        }

        result.WorkerWCandidatesBeforeMessage.AddRange(EnumerateDesktopCandidates(result, updateShellState: false));

        if (!result.ProgmanFound)
        {
            result.Ok = false;
            result.Reason = "progman_not_found";
            result.Errors.Add("Progman window not found.");
            result.WorkerWCandidates.AddRange(EnumerateDesktopCandidates(result, updateShellState: true));
            AddWorkerWDiff(result);
            SelectPreferredWorkerW(result);
            AddWorkerWDiscoveryStrategies(result);
            return result;
        }

        var messageResults = SendWorkerWCreationMessages(progman);
        result.WorkerWMessageSent = messageResults.Any((messageResult) => messageResult.sent);
        result.WorkerWMessageResult = string.Join(";", messageResults.Select((messageResult) =>
            $"{messageResult.wParam}:{messageResult.lParam}:{(messageResult.sent ? messageResult.result : $"send_failed:{messageResult.error}")}"));

        if (!result.WorkerWMessageSent)
        {
            result.Warnings.Add("WorkerW creation message failed; continuing discovery.");
        }

        result.WorkerWCandidates.AddRange(EnumerateDesktopCandidates(result, updateShellState: true));
        AddProgmanChildWorkerWCandidates(result, progman);
        AddWorkerWDiff(result);
        SelectPreferredWorkerW(result);
        AddWorkerWDiscoveryStrategies(result);

        result.Ok = result.ShellDllDefViewFound || result.WorkerWCandidates.Count > 0;
        if (!result.Ok)
        {
            result.Reason = "desktop_workerw_not_found";
            result.Errors.Add("SHELLDLL_DefView or WorkerW candidates were not found.");
        }

        return result;
    }

    private static List<WorkerWindowCandidate> EnumerateDesktopCandidates(
        DesktopDiscoveryResult result,
        bool updateShellState)
    {
        var candidates = new List<WorkerWindowCandidate>();
        var seen = new HashSet<string>(StringComparer.Ordinal);

        Win32.EnumWindows((hwnd, _) =>
        {
            var className = Win32.GetClassNameSafe(hwnd);
            var shellDllDefView = Win32.FindWindowEx(hwnd, IntPtr.Zero, "SHELLDLL_DefView", null);
            var hasShellDllDefView = shellDllDefView != IntPtr.Zero;

            if (hasShellDllDefView && updateShellState)
            {
                result.ShellDllDefViewFound = true;
                result.ShellDllDefViewHwnd ??= Win32.HwndToNullableString(shellDllDefView);
                var sysListView32 = Win32.FindDescendantWindow(shellDllDefView, "SysListView32");
                result.SysListView32Hwnd ??= Win32.HwndToNullableString(sysListView32);
            }

            if (hasShellDllDefView)
            {
                AddCandidate(
                    result,
                    candidates,
                    seen,
                    hwnd,
                    className,
                    hasShellDllDefView: true,
                    candidateReason: "top_level_window_with_shelldll_defview");

                var siblingWorkerW = Win32.FindWindowEx(IntPtr.Zero, hwnd, "WorkerW", null);
                if (siblingWorkerW != IntPtr.Zero)
                {
                    AddCandidate(
                        result,
                        candidates,
                        seen,
                        siblingWorkerW,
                        Win32.GetClassNameSafe(siblingWorkerW),
                        hasShellDllDefView: false,
                        candidateReason: "workerw_sibling_after_shelldll_defview");
                }
            }

            if (string.Equals(className, "WorkerW", StringComparison.Ordinal))
            {
                AddCandidate(
                    result,
                    candidates,
                    seen,
                    hwnd,
                    className,
                    hasShellDllDefView,
                    hasShellDllDefView
                        ? "workerw_with_shelldll_defview"
                        : "workerw_candidate_without_shelldll_defview");
            }

            return true;
        }, IntPtr.Zero);

        return candidates;
    }

    private static void AddCandidate(
        DesktopDiscoveryResult result,
        List<WorkerWindowCandidate> candidates,
        HashSet<string> seen,
        IntPtr hwnd,
        string className,
        bool hasShellDllDefView,
        string candidateReason)
    {
        var hwndText = Win32.HwndToString(hwnd);
        if (string.IsNullOrEmpty(hwndText) || !seen.Add(hwndText))
        {
            return;
        }

        candidates.Add(CreateCandidate(result, hwnd, className, hasShellDllDefView, candidateReason));
    }

    private static WorkerWindowCandidate CreateCandidate(
        DesktopDiscoveryResult result,
        IntPtr hwnd,
        string className,
        bool hasShellDllDefView,
        string candidateReason)
    {
        Win32.GetWindowThreadProcessId(hwnd, out var processId);
        var rect = Win32.GetRectSafe(hwnd);
        var parent = Win32.GetParent(hwnd);
        var owner = Win32.GetWindow(hwnd, Win32.GwOwner);
        var style = Win32.GetWindowLongPtr(hwnd, Win32.GwlStyle);
        var exStyle = Win32.GetWindowLongPtr(hwnd, Win32.GwlExStyle);
        var monitor = Win32.GetNearestMonitorInfoSafe(hwnd);
        var windowText = Win32.GetWindowTextSafe(hwnd);
        var hasShellDllDefViewDescendant = hasShellDllDefView ||
            Win32.HasDescendantWindow(hwnd, "SHELLDLL_DefView");
        var hasSysListView32 = Win32.HasDescendantWindow(hwnd, "SysListView32");
        var visible = Win32.IsWindowVisible(hwnd);
        var candidate = new WorkerWindowCandidate
        {
            Hwnd = Win32.HwndToString(hwnd),
            ClassName = className,
            WindowText = windowText,
            Title = windowText,
            ParentHwnd = Win32.HwndToNullableString(parent),
            OwnerHwnd = Win32.HwndToNullableString(owner),
            ProcessId = processId,
            Style = Win32.IntPtrToHex(style),
            ExStyle = Win32.IntPtrToHex(exStyle),
            IsVisible = visible,
            Visible = visible,
            Rect = rect,
            Width = rect?.Width ?? 0,
            Height = rect?.Height ?? 0,
            Monitor = monitor,
            MatchesVirtualScreen = Win32.RectMatches(rect, result.VirtualScreenRect),
            MatchesPrimaryScreen = Win32.RectMatches(rect, result.PrimaryScreenRect),
            CoversVirtualScreen = Win32.RectCovers(rect, result.VirtualScreenRect),
            CoversPrimaryScreen = Win32.RectCovers(rect, result.PrimaryScreenRect),
            HasShellDllDefView = hasShellDllDefView,
            HasShellDllDefViewDescendant = hasShellDllDefViewDescendant,
            HasSysListView32 = hasSysListView32,
            CandidateReason = candidateReason,
        };

        candidate.RejectReason = GetRejectReason(candidate);
        candidate.AttachRejectReason = candidate.RejectReason;
        candidate.RejectedForAttach = !string.IsNullOrWhiteSpace(candidate.RejectReason);
        candidate.EmptyRect = candidate.Rect is null || candidate.Width <= 0 || candidate.Height <= 0;
        candidate.TooSmall = !candidate.EmptyRect && (candidate.Width < 320 || candidate.Height < 200);
        candidate.NoDesktopSizeMatch = !candidate.CoversPrimaryScreen && !candidate.CoversVirtualScreen;
        candidate.NoShellDllDefViewRelation =
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal) &&
            !candidate.HasShellDllDefViewDescendant &&
            !string.Equals(candidate.CandidateReason, "workerw_sibling_after_shelldll_defview", StringComparison.Ordinal);
        candidate.VisibleFalseButPossibleWallpaperLayer =
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal) &&
            !candidate.IsVisible &&
            !candidate.EmptyRect &&
            !candidate.HasShellDllDefViewDescendant &&
            !candidate.HasSysListView32;
        candidate.UsableForProbe =
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal) &&
            !candidate.EmptyRect &&
            !candidate.TooSmall &&
            !candidate.HasShellDllDefViewDescendant &&
            !candidate.HasSysListView32 &&
            (candidate.CoversPrimaryScreen ||
                candidate.CoversVirtualScreen ||
                candidate.MatchesPrimaryScreen ||
                candidate.MatchesVirtualScreen ||
                string.Equals(candidate.CandidateReason, "workerw_sibling_after_shelldll_defview", StringComparison.Ordinal));
        candidate.SelectionReason = GetSelectionReason(candidate);
        return candidate;
    }

    internal static WorkerWindowCandidate? GetBestWorkerWProbeCandidate(DesktopDiscoveryResult result)
    {
        var selectedStrategy = result.WorkerWDiscoveryStrategies
            .Where((strategy) => strategy.Found && !string.IsNullOrWhiteSpace(strategy.CandidateHwnd))
            .OrderByDescending((strategy) => strategy.CandidateScore)
            .FirstOrDefault((strategy) =>
            {
                var candidate = result.WorkerWCandidates.FirstOrDefault((entry) =>
                    string.Equals(entry.Hwnd, strategy.CandidateHwnd, StringComparison.Ordinal));
                return candidate?.UsableForProbe == true;
            });

        if (selectedStrategy is not null)
        {
            selectedStrategy.SelectedByStrategy = true;
            return result.WorkerWCandidates.FirstOrDefault((candidate) =>
                string.Equals(candidate.Hwnd, selectedStrategy.CandidateHwnd, StringComparison.Ordinal));
        }

        return result.WorkerWCandidates
            .Where((candidate) => candidate.UsableForProbe)
            .OrderByDescending(ScoreCandidate)
            .FirstOrDefault();
    }

    internal static WorkerWindowCandidate? GetBestProgmanChildWorkerW(DesktopDiscoveryResult result)
    {
        var selected = result.ProgmanChildWorkerWCandidates
            .Where((candidate) => string.IsNullOrWhiteSpace(candidate.RejectReason) || candidate.UsableForProbe)
            .OrderByDescending(ScoreCandidate)
            .FirstOrDefault();
        if (selected is null)
        {
            return null;
        }

        result.SelectedProgmanChildWorkerWHwnd = selected.Hwnd;
        var strategy = result.WorkerWDiscoveryStrategies.FirstOrDefault((entry) =>
            string.Equals(entry.StrategyName, "progman_child_workerw_algorithm", StringComparison.Ordinal) &&
            string.Equals(entry.CandidateHwnd, selected.Hwnd, StringComparison.Ordinal));
        if (strategy is not null)
        {
            strategy.SelectedByStrategy = true;
        }

        return selected;
    }

    internal static string? GetSelectedStrategyName(DesktopDiscoveryResult result, string? hwnd)
    {
        if (string.IsNullOrWhiteSpace(hwnd))
        {
            return null;
        }

        return result.WorkerWDiscoveryStrategies.FirstOrDefault((strategy) =>
            strategy.SelectedByStrategy ||
            string.Equals(strategy.CandidateHwnd, hwnd, StringComparison.Ordinal))?.StrategyName;
    }

    private static void SelectPreferredWorkerW(DesktopDiscoveryResult result)
    {
        var ranked = result.WorkerWCandidates
            .Select((candidate) => new
            {
                Candidate = candidate,
                Score = ScoreCandidate(candidate),
            })
            .OrderByDescending((entry) => string.IsNullOrWhiteSpace(entry.Candidate.RejectReason))
            .ThenByDescending((entry) => entry.Score)
            .ThenBy((entry) => entry.Candidate.Hwnd, StringComparer.Ordinal)
            .ToList();

        for (var index = 0; index < ranked.Count; index += 1)
        {
            var entry = ranked[index];
            entry.Candidate.SelectionRank = index + 1;
            result.WorkerWSelectionOrder.Add(new WorkerWindowSelectionEntry
            {
                Rank = index + 1,
                Hwnd = entry.Candidate.Hwnd,
                ClassName = entry.Candidate.ClassName,
                RejectReason = entry.Candidate.RejectReason,
                SelectionReason = entry.Candidate.SelectionReason,
                Score = entry.Score,
            });
        }

        var preferred = ranked.FirstOrDefault((entry) =>
            string.IsNullOrWhiteSpace(entry.Candidate.RejectReason))?.Candidate;

        if (preferred is not null)
        {
            result.PreferredWorkerWHwnd = preferred.Hwnd;
            result.PreferredReason = preferred.SelectionReason;
            return;
        }

        var closest = ranked.FirstOrDefault((entry) =>
            string.Equals(entry.Candidate.ClassName, "WorkerW", StringComparison.Ordinal))?.Candidate;
        if (closest is not null)
        {
            result.ClosestWorkerWHwnd = closest.Hwnd;
            result.ClosestWorkerWReason = closest.RejectReason;
        }

        if (result.WorkerWCandidates.Count > 0)
        {
            result.Warnings.Add("WorkerW candidates were found, but no desktop-sized WorkerW background target was available.");
        }
    }

    private static void AddWorkerWDiscoveryStrategies(DesktopDiscoveryResult result)
    {
        var shellTopLevel = FindTopLevelShellWindow();
        var shellDllDefView = shellTopLevel == IntPtr.Zero
            ? IntPtr.Zero
            : Win32.FindWindowEx(shellTopLevel, IntPtr.Zero, "SHELLDLL_DefView", null);
        var shellParent = shellDllDefView == IntPtr.Zero ? IntPtr.Zero : Win32.GetParent(shellDllDefView);
        var sysListView32 = shellDllDefView == IntPtr.Zero
            ? IntPtr.Zero
            : Win32.FindDescendantWindow(shellDllDefView, "SysListView32");
        var nextSiblingWorkerW = shellTopLevel == IntPtr.Zero
            ? IntPtr.Zero
            : Win32.FindWindowEx(IntPtr.Zero, shellTopLevel, "WorkerW", null);
        var previousSiblingWorkerW = shellTopLevel == IntPtr.Zero
            ? IntPtr.Zero
            : FindPreviousTopLevelWorkerW(shellTopLevel);
        var firstFindWindowExWorkerW = Win32.FindWindowEx(IntPtr.Zero, IntPtr.Zero, "WorkerW", null);
        var progman = Win32.ParseHwnd(result.ProgmanHwnd);
        var progmanChildWorkerW = result.ProgmanChildWorkerWCandidates
            .OrderByDescending(ScoreCandidate)
            .FirstOrDefault();

        result.WorkerWDiscoveryStrategies.Add(CreateStrategy(
            result,
            "current_algorithm",
            Win32.ParseHwnd(result.PreferredWorkerWHwnd ?? result.ClosestWorkerWHwnd),
            shellDllDefView,
            shellParent,
            sysListView32,
            nextSiblingWorkerW,
            previousSiblingWorkerW,
            firstFindWindowExWorkerW));

        result.WorkerWDiscoveryStrategies.Add(CreateStrategy(
            result,
            "classic_0x052c_algorithm",
            nextSiblingWorkerW != IntPtr.Zero ? nextSiblingWorkerW : previousSiblingWorkerW,
            shellDllDefView,
            shellParent,
            sysListView32,
            nextSiblingWorkerW,
            previousSiblingWorkerW,
            firstFindWindowExWorkerW));

        result.WorkerWDiscoveryStrategies.Add(CreateStrategy(
            result,
            "shelldll_defview_owner_based_algorithm",
            SelectShellOwnerCandidate(shellParent, nextSiblingWorkerW, previousSiblingWorkerW),
            shellDllDefView,
            shellParent,
            sysListView32,
            nextSiblingWorkerW,
            previousSiblingWorkerW,
            firstFindWindowExWorkerW));

        result.WorkerWDiscoveryStrategies.Add(CreateStrategy(
            result,
            "next_sibling_workerw_algorithm",
            nextSiblingWorkerW,
            shellDllDefView,
            shellParent,
            sysListView32,
            nextSiblingWorkerW,
            previousSiblingWorkerW,
            firstFindWindowExWorkerW));

        result.WorkerWDiscoveryStrategies.Add(CreateStrategy(
            result,
            "findwindowex_based_algorithm",
            firstFindWindowExWorkerW,
            shellDllDefView,
            shellParent,
            sysListView32,
            nextSiblingWorkerW,
            previousSiblingWorkerW,
            firstFindWindowExWorkerW));

        result.WorkerWDiscoveryStrategies.Add(CreateStrategy(
            result,
            "progman_child_workerw_algorithm",
            Win32.ParseHwnd(progmanChildWorkerW?.Hwnd),
            shellDllDefView,
            shellParent,
            sysListView32,
            nextSiblingWorkerW,
            previousSiblingWorkerW,
            firstFindWindowExWorkerW));
    }

    private static WorkerWDiscoveryStrategy CreateStrategy(
        DesktopDiscoveryResult result,
        string strategyName,
        IntPtr candidateHwnd,
        IntPtr shellDllDefView,
        IntPtr shellParent,
        IntPtr sysListView32,
        IntPtr nextSiblingWorkerW,
        IntPtr previousSiblingWorkerW,
        IntPtr findWindowExWorkerW)
    {
        var candidate = FindOrCreateStrategyCandidate(result, candidateHwnd);
        return new WorkerWDiscoveryStrategy
        {
            StrategyName = strategyName,
            Found = candidate is not null,
            CandidateHwnd = candidate?.Hwnd,
            CandidateClassName = candidate?.ClassName ?? string.Empty,
            ShellDllDefViewHwnd = Win32.HwndToNullableString(shellDllDefView),
            ShellDllDefViewParentHwnd = Win32.HwndToNullableString(shellParent),
            SysListView32Hwnd = Win32.HwndToNullableString(sysListView32),
            NextSiblingWorkerWHwnd = Win32.HwndToNullableString(nextSiblingWorkerW),
            PreviousSiblingWorkerWHwnd = Win32.HwndToNullableString(previousSiblingWorkerW),
            FindWindowExWorkerWResult = Win32.HwndToNullableString(findWindowExWorkerW),
            CandidateRect = candidate?.Rect,
            CandidateVisible = candidate?.IsVisible ?? false,
            CandidateStyle = candidate?.Style ?? string.Empty,
            CandidateExStyle = candidate?.ExStyle ?? string.Empty,
            CandidateProcessId = candidate?.ProcessId ?? 0,
            CandidateRejectReason = candidate?.RejectReason ?? "candidate_not_found",
            CandidateScore = candidate is null ? 0 : ScoreCandidate(candidate),
        };
    }

    private static WorkerWindowCandidate? FindOrCreateStrategyCandidate(DesktopDiscoveryResult result, IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero || !Win32.IsWindow(hwnd))
        {
            return null;
        }

        var hwndText = Win32.HwndToString(hwnd);
        var existing = result.WorkerWCandidates.FirstOrDefault((candidate) =>
            string.Equals(candidate.Hwnd, hwndText, StringComparison.Ordinal));
        if (existing is not null)
        {
            return existing;
        }

        var candidate = CreateCandidate(
            result,
            hwnd,
            Win32.GetClassNameSafe(hwnd),
            Win32.FindWindowEx(hwnd, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero,
            "strategy_candidate");
        result.WorkerWCandidates.Add(candidate);
        return candidate;
    }

    private static void AddProgmanChildWorkerWCandidates(DesktopDiscoveryResult result, IntPtr progman)
    {
        if (progman == IntPtr.Zero || !Win32.IsWindow(progman))
        {
            return;
        }

        var seen = new HashSet<string>(result.WorkerWCandidates.Select((candidate) => candidate.Hwnd), StringComparer.Ordinal);
        foreach (var child in Win32.EnumerateChildWindows(progman))
        {
            if (!string.Equals(Win32.GetClassNameSafe(child), "WorkerW", StringComparison.Ordinal))
            {
                continue;
            }

            var candidate = CreateCandidate(
                result,
                child,
                "WorkerW",
                hasShellDllDefView: Win32.FindWindowEx(child, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero,
                candidateReason: "progman_child_workerw");
            if (IsProgmanChildWorkerWProbeCandidate(candidate, result.ProgmanHwnd))
            {
                candidate.RejectReason = "progman_child_workerw_probe_only";
                candidate.AttachRejectReason = candidate.RejectReason;
                candidate.RejectedForAttach = true;
                candidate.UsableForProbe = true;
                candidate.SelectionReason = $"rejected:{candidate.RejectReason}";
            }
            else
            {
                candidate.RejectReason = string.IsNullOrWhiteSpace(candidate.RejectReason)
                    ? "not_progman_child_workerw_probe_candidate"
                    : candidate.RejectReason;
                candidate.AttachRejectReason = candidate.RejectReason;
                candidate.RejectedForAttach = true;
                candidate.UsableForProbe = false;
                candidate.SelectionReason = $"rejected:{candidate.RejectReason}";
            }

            result.ProgmanChildWorkerWCandidates.Add(candidate);
            if (seen.Add(candidate.Hwnd))
            {
                result.WorkerWCandidates.Add(candidate);
            }
        }
    }

    private static bool IsProgmanChildWorkerWProbeCandidate(WorkerWindowCandidate candidate, string? progmanHwnd)
    {
        return string.Equals(candidate.ParentHwnd, progmanHwnd, StringComparison.Ordinal) &&
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal) &&
            candidate.IsVisible &&
            !candidate.EmptyRect &&
            (candidate.MatchesPrimaryScreen ||
                candidate.MatchesVirtualScreen ||
                candidate.CoversPrimaryScreen ||
                candidate.CoversVirtualScreen) &&
            !candidate.HasShellDllDefViewDescendant &&
            !candidate.HasSysListView32;
    }

    private static IntPtr FindTopLevelShellWindow()
    {
        var found = IntPtr.Zero;
        Win32.EnumWindows((hwnd, _) =>
        {
            if (Win32.FindWindowEx(hwnd, IntPtr.Zero, "SHELLDLL_DefView", null) == IntPtr.Zero)
            {
                return true;
            }

            found = hwnd;
            return false;
        }, IntPtr.Zero);
        return found;
    }

    private static IntPtr FindPreviousTopLevelWorkerW(IntPtr targetHwnd)
    {
        var previousWorkerW = IntPtr.Zero;
        var found = IntPtr.Zero;
        Win32.EnumWindows((hwnd, _) =>
        {
            if (hwnd == targetHwnd)
            {
                found = previousWorkerW;
                return false;
            }

            if (string.Equals(Win32.GetClassNameSafe(hwnd), "WorkerW", StringComparison.Ordinal))
            {
                previousWorkerW = hwnd;
            }

            return true;
        }, IntPtr.Zero);
        return found;
    }

    private static IntPtr SelectShellOwnerCandidate(
        IntPtr shellParent,
        IntPtr nextSiblingWorkerW,
        IntPtr previousSiblingWorkerW)
    {
        if (shellParent != IntPtr.Zero &&
            string.Equals(Win32.GetClassNameSafe(shellParent), "WorkerW", StringComparison.Ordinal))
        {
            var owner = Win32.GetWindow(shellParent, Win32.GwOwner);
            if (owner != IntPtr.Zero &&
                string.Equals(Win32.GetClassNameSafe(owner), "WorkerW", StringComparison.Ordinal))
            {
                return owner;
            }
        }

        if (nextSiblingWorkerW != IntPtr.Zero)
        {
            return nextSiblingWorkerW;
        }

        return previousSiblingWorkerW != IntPtr.Zero ? previousSiblingWorkerW : shellParent;
    }

    private static void AddWorkerWDiff(DesktopDiscoveryResult result)
    {
        var before = result.WorkerWCandidatesBeforeMessage
            .Where((candidate) => string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal))
            .Select((candidate) => candidate.Hwnd)
            .ToHashSet(StringComparer.Ordinal);
        var after = result.WorkerWCandidates
            .Where((candidate) => string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal))
            .Select((candidate) => candidate.Hwnd)
            .ToHashSet(StringComparer.Ordinal);

        result.WorkerWCreatedHwnds.AddRange(after.Except(before).OrderBy((hwnd) => hwnd, StringComparer.Ordinal));
        result.WorkerWRemovedHwnds.AddRange(before.Except(after).OrderBy((hwnd) => hwnd, StringComparer.Ordinal));
    }

    private static string GetRejectReason(WorkerWindowCandidate candidate)
    {
        if (!string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal))
        {
            return "not_workerw";
        }

        if (candidate.Rect is null)
        {
            return "missing_rect";
        }

        if (candidate.Width <= 0 || candidate.Height <= 0)
        {
            return "empty_rect";
        }

        if (!candidate.IsVisible)
        {
            return "not_visible";
        }

        if (candidate.HasShellDllDefViewDescendant || candidate.HasSysListView32)
        {
            return "contains_desktop_icon_view";
        }

        if (!candidate.CoversPrimaryScreen && !candidate.CoversVirtualScreen)
        {
            return "not_desktop_sized";
        }

        return string.Empty;
    }

    private static string GetSelectionReason(WorkerWindowCandidate candidate)
    {
        if (!string.IsNullOrWhiteSpace(candidate.RejectReason))
        {
            return $"rejected:{candidate.RejectReason}";
        }

        if (candidate.MatchesVirtualScreen)
        {
            return "eligible:matches_virtual_screen";
        }

        if (candidate.MatchesPrimaryScreen)
        {
            return "eligible:matches_primary_screen";
        }

        if (candidate.CoversVirtualScreen)
        {
            return "eligible:covers_virtual_screen";
        }

        return "eligible:covers_primary_screen";
    }

    internal static int ScoreCandidate(WorkerWindowCandidate candidate)
    {
        var score = 0;
        if (string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal))
        {
            score += 1_000;
        }

        if (candidate.MatchesVirtualScreen)
        {
            score += 500;
        }
        else if (candidate.MatchesPrimaryScreen)
        {
            score += 450;
        }
        else if (candidate.CoversVirtualScreen)
        {
            score += 350;
        }
        else if (candidate.CoversPrimaryScreen)
        {
            score += 300;
        }

        if (!candidate.HasShellDllDefViewDescendant && !candidate.HasSysListView32)
        {
            score += 120;
        }

        if (candidate.IsVisible)
        {
            score += 80;
        }

        score += Math.Min(candidate.Width, 10_000) / 100;
        score += Math.Min(candidate.Height, 10_000) / 100;
        return score;
    }

    private static List<(string wParam, string lParam, bool sent, string result, int error)> SendWorkerWCreationMessages(IntPtr progman)
    {
        var messages = new List<(UIntPtr wParam, IntPtr lParam)>
        {
            (UIntPtr.Zero, IntPtr.Zero),
            (new UIntPtr(0x0D), IntPtr.Zero),
            (new UIntPtr(0x0D), new IntPtr(1)),
        };
        var results = new List<(string wParam, string lParam, bool sent, string result, int error)>();

        foreach (var message in messages)
        {
            var sendResult = Win32.SendMessageTimeoutW(
                progman,
                Win32.WorkerWMessage,
                message.wParam,
                message.lParam,
                Win32.SmtoNormal | Win32.SmtoAbortIfHung,
                1_000,
                out var messageResult);

            results.Add((
                message.wParam.ToUInt64().ToString(),
                message.lParam.ToInt64().ToString(),
                sendResult != IntPtr.Zero,
                messageResult.ToUInt64().ToString(),
                Win32.GetLastError()));
        }

        return results;
    }
}
