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

        if (!result.ProgmanFound)
        {
            result.Ok = false;
            result.Reason = "progman_not_found";
            result.Errors.Add("Progman window not found.");
            EnumerateDesktopCandidates(result);
            SelectPreferredWorkerW(result);
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

        EnumerateDesktopCandidates(result);
        SelectPreferredWorkerW(result);

        result.Ok = result.ShellDllDefViewFound || result.WorkerWCandidates.Count > 0;
        if (!result.Ok)
        {
            result.Reason = "desktop_workerw_not_found";
            result.Errors.Add("SHELLDLL_DefView or WorkerW candidates were not found.");
        }

        return result;
    }

    private static void EnumerateDesktopCandidates(DesktopDiscoveryResult result)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);

        Win32.EnumWindows((hwnd, _) =>
        {
            var className = Win32.GetClassNameSafe(hwnd);
            var hasShellDllDefView =
                Win32.FindWindowEx(hwnd, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero;

            if (hasShellDllDefView)
            {
                result.ShellDllDefViewFound = true;
                AddCandidate(
                    result,
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
    }

    private static void AddCandidate(
        DesktopDiscoveryResult result,
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

        result.WorkerWCandidates.Add(new WorkerWindowCandidate
        {
            Hwnd = hwndText,
            ClassName = className,
            Title = Win32.GetWindowTextSafe(hwnd),
            Visible = Win32.IsWindowVisible(hwnd),
            Rect = Win32.GetRectSafe(hwnd),
            HasShellDllDefView = hasShellDllDefView,
            CandidateReason = candidateReason,
        });
    }

    private static void SelectPreferredWorkerW(DesktopDiscoveryResult result)
    {
        var desktopSizedCandidates = result.WorkerWCandidates
            .Where(IsDesktopSizedCandidate)
            .ToList();

        var preferred = desktopSizedCandidates.FirstOrDefault((candidate) =>
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal) &&
            !candidate.HasShellDllDefView);

        if (preferred is not null)
        {
            result.PreferredWorkerWHwnd = preferred.Hwnd;
            result.PreferredReason = preferred.CandidateReason;
            return;
        }

        preferred = desktopSizedCandidates.FirstOrDefault((candidate) =>
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal));

        if (preferred is not null)
        {
            result.PreferredWorkerWHwnd = preferred.Hwnd;
            result.PreferredReason = preferred.CandidateReason;
            return;
        }

        if (result.WorkerWCandidates.Count > 0)
        {
            result.Warnings.Add("WorkerW candidates were found, but no desktop-sized WorkerW background target was available.");
        }
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

    private static bool IsDesktopSizedCandidate(WorkerWindowCandidate candidate)
    {
        if (candidate.Rect is null)
        {
            return false;
        }

        var screenWidth = Math.Max(1, Win32.GetSystemMetrics(Win32.SmCxScreen));
        var screenHeight = Math.Max(1, Win32.GetSystemMetrics(Win32.SmCyScreen));
        var virtualWidth = Math.Max(screenWidth, Win32.GetSystemMetrics(Win32.SmCxVirtualScreen));
        var virtualHeight = Math.Max(screenHeight, Win32.GetSystemMetrics(Win32.SmCyVirtualScreen));

        return candidate.Rect.Width >= screenWidth && candidate.Rect.Height >= screenHeight ||
            candidate.Rect.Width >= virtualWidth && candidate.Rect.Height >= screenHeight ||
            candidate.Rect.Width >= screenWidth && candidate.Rect.Height >= virtualHeight;
    }
}
