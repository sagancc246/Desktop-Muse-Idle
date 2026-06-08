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

        var sendResult = Win32.SendMessageTimeoutW(
            progman,
            Win32.WorkerWMessage,
            UIntPtr.Zero,
            IntPtr.Zero,
            Win32.SmtoNormal | Win32.SmtoAbortIfHung,
            1_000,
            out var messageResult);

        result.WorkerWMessageSent = sendResult != IntPtr.Zero;
        result.WorkerWMessageResult = result.WorkerWMessageSent
            ? messageResult.ToUInt64().ToString()
            : $"send_failed:{Win32.GetLastError()}";

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
        var preferred = result.WorkerWCandidates.FirstOrDefault((candidate) =>
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal) &&
            !candidate.HasShellDllDefView);

        if (preferred is not null)
        {
            result.PreferredWorkerWHwnd = preferred.Hwnd;
            result.PreferredReason = preferred.CandidateReason;
            return;
        }

        preferred = result.WorkerWCandidates.FirstOrDefault((candidate) =>
            string.Equals(candidate.ClassName, "WorkerW", StringComparison.Ordinal));

        if (preferred is not null)
        {
            result.PreferredWorkerWHwnd = preferred.Hwnd;
            result.PreferredReason = preferred.CandidateReason;
            return;
        }

        preferred = result.WorkerWCandidates.FirstOrDefault((candidate) => candidate.HasShellDllDefView);
        if (preferred is not null)
        {
            result.PreferredWorkerWHwnd = preferred.Hwnd;
            result.PreferredReason = "fallback_shelldll_defview_parent";
        }
    }
}
