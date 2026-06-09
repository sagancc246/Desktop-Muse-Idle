namespace WallpaperHelper;

internal static class WallpaperAttacher
{
    internal static WallpaperAttachResult Attach(string helperVersion, string hwndText)
    {
        var result = CreateAttachResult(helperVersion, hwndText);
        var hwnd = ParseHwnd(hwndText);
        if (hwnd == IntPtr.Zero)
        {
            result.Reason = "invalid_hwnd";
            result.Errors.Add("HWND is missing or invalid.");
            return result;
        }

        if (!OperatingSystem.IsWindows())
        {
            result.Reason = "unsupported_platform";
            result.Errors.Add("SetParent attach is only available on Windows.");
            return result;
        }

        if (!Win32.IsWindow(hwnd))
        {
            result.Reason = "target_window_not_found";
            result.Errors.Add("Target HWND is not a valid window.");
            return result;
        }

        var discovery = DesktopWindowFinder.FindDesktop(helperVersion, "attach");
        CopyDiscovery(result, discovery);
        if (string.IsNullOrWhiteSpace(discovery.PreferredWorkerWHwnd))
        {
            result.Reason = "workerw_not_found";
            result.Errors.Add("WorkerW candidate was not found.");
            return result;
        }

        var workerW = ParseHwnd(discovery.PreferredWorkerWHwnd);
        if (workerW == IntPtr.Zero || !Win32.IsWindow(workerW))
        {
            result.Reason = "workerw_invalid";
            result.Errors.Add("Preferred WorkerW candidate is not a valid window.");
            return result;
        }

        result.WorkerWHwnd = Win32.HwndToString(workerW);
        var targetCandidate = discovery.WorkerWCandidates.FirstOrDefault((candidate) =>
            string.Equals(candidate.Hwnd, discovery.PreferredWorkerWHwnd, StringComparison.Ordinal));
        var previousParent = Win32.GetParent(hwnd);
        result.PreviousParentHwnd = previousParent == IntPtr.Zero ? null : Win32.HwndToString(previousParent);

        var previousStyle = Win32.GetWindowLongPtr(hwnd, Win32.GwlStyle);
        var previousExStyle = Win32.GetWindowLongPtr(hwnd, Win32.GwlExStyle);
        result.PreviousStyle = previousStyle.ToInt64().ToString();
        result.PreviousExStyle = previousExStyle.ToInt64().ToString();

        var newStyleValue =
            (previousStyle.ToInt64() | Win32.WsChild | Win32.WsVisible | Win32.WsClipSiblings | Win32.WsClipChildren) &
            ~Win32.WsPopup;
        var newExStyleValue = previousExStyle.ToInt64() | Win32.WsExToolWindow | Win32.WsExNoActivate;

        Win32.SetWindowLongPtr(hwnd, Win32.GwlStyle, new IntPtr(newStyleValue));
        var styleError = Win32.GetLastError();
        Win32.SetWindowLongPtr(hwnd, Win32.GwlExStyle, new IntPtr(newExStyleValue));
        var exStyleError = Win32.GetLastError();
        result.NewStyle = newStyleValue.ToString();
        result.NewExStyle = newExStyleValue.ToString();
        result.StyleAdjusted = true;

        if (styleError != 0)
        {
            result.Warnings.Add($"SetWindowLongPtr style last error: {styleError}");
        }

        if (exStyleError != 0)
        {
            result.Warnings.Add($"SetWindowLongPtr exStyle last error: {exStyleError}");
        }

        var setParentResult = Win32.SetParent(hwnd, workerW);
        result.SetParentSucceeded = setParentResult != IntPtr.Zero || Win32.GetParent(hwnd) == workerW;
        if (!result.SetParentSucceeded)
        {
            result.Reason = "set_parent_failed";
            result.Errors.Add($"SetParent failed: {Win32.GetLastError()}");
            TryRestore(hwnd, previousParent, previousStyle, previousExStyle);
            return result;
        }

        var targetRect = targetCandidate?.Rect;
        var width = Math.Max(1, targetRect?.Width ?? Win32.GetSystemMetrics(Win32.SmCxScreen));
        var height = Math.Max(1, targetRect?.Height ?? Win32.GetSystemMetrics(Win32.SmCyScreen));
        Win32.ShowWindow(hwnd, Win32.SwShowNoActivate);
        result.SetWindowPosSucceeded = Win32.SetWindowPos(
            hwnd,
            Win32.HwndBottom,
            0,
            0,
            width,
            height,
            Win32.SwpNoActivate | Win32.SwpFrameChanged | Win32.SwpShowWindow);
        result.Position = new
        {
            x = 0,
            y = 0,
            width,
            height,
        };

        if (!result.SetWindowPosSucceeded)
        {
            result.Reason = "set_window_pos_failed";
            result.Errors.Add($"SetWindowPos failed: {Win32.GetLastError()}");
            TryRestore(hwnd, previousParent, previousStyle, previousExStyle);
            return result;
        }

        result.Ok = true;
        result.Attached = true;
        result.Backend = "native_desktop_wallpaper";
        result.Reason = null;
        return result;
    }

    internal static WallpaperDetachResult Detach(
        string helperVersion,
        string? hwndText,
        string? previousParentText,
        string? previousStyleText,
        string? previousExStyleText)
    {
        var result = new WallpaperDetachResult
        {
            HelperVersion = helperVersion,
            Hwnd = hwndText,
            PreviousParentHwnd = previousParentText,
        };
        var hwnd = ParseHwnd(hwndText);
        if (hwnd == IntPtr.Zero)
        {
            result.Reason = "missing_hwnd";
            result.Warnings.Add("Detach skipped because HWND is missing.");
            result.Ok = true;
            return result;
        }

        if (!OperatingSystem.IsWindows())
        {
            result.Reason = "unsupported_platform";
            result.Warnings.Add("Detach skipped because platform is not Windows.");
            result.Ok = true;
            return result;
        }

        if (!Win32.IsWindow(hwnd))
        {
            result.Reason = "target_window_not_found";
            result.Warnings.Add("Detach skipped because target HWND is no longer a valid window.");
            result.Ok = true;
            return result;
        }

        var previousParent = ParseHwnd(previousParentText);
        if (previousParent != IntPtr.Zero && Win32.IsWindow(previousParent))
        {
            Win32.SetParent(hwnd, previousParent);
            result.SetParentSucceeded = Win32.GetParent(hwnd) == previousParent;
            if (!result.SetParentSucceeded)
            {
                result.Warnings.Add($"SetParent detach failed: {Win32.GetLastError()}");
            }
        }
        else
        {
            result.Warnings.Add("Previous parent HWND is unavailable; Electron close fallback is required.");
        }

        if (long.TryParse(previousStyleText, out var previousStyle))
        {
            Win32.SetWindowLongPtr(hwnd, Win32.GwlStyle, new IntPtr(previousStyle));
            result.StyleRestored = true;
        }

        if (long.TryParse(previousExStyleText, out var previousExStyle))
        {
            Win32.SetWindowLongPtr(hwnd, Win32.GwlExStyle, new IntPtr(previousExStyle));
            result.StyleRestored = true;
        }

        result.Ok = true;
        result.Detached = result.SetParentSucceeded || !result.Warnings.Any((warning) => warning.StartsWith("SetParent detach failed", StringComparison.Ordinal));
        result.Reason = result.Detached ? null : "detach_partial";
        return result;
    }

    private static WallpaperAttachResult CreateAttachResult(string helperVersion, string hwnd)
    {
        return new WallpaperAttachResult
        {
            Ok = false,
            Command = "attach",
            HelperVersion = helperVersion,
            Hwnd = hwnd,
            Attached = false,
            Backend = "fallback_stage",
        };
    }

    private static void CopyDiscovery(WallpaperAttachResult target, DesktopDiscoveryResult source)
    {
        target.ProgmanFound = source.ProgmanFound;
        target.ProgmanHwnd = source.ProgmanHwnd;
        target.WorkerWMessageSent = source.WorkerWMessageSent;
        target.WorkerWMessageResult = source.WorkerWMessageResult;
        target.ShellDllDefViewFound = source.ShellDllDefViewFound;
        target.PreferredWorkerWHwnd = source.PreferredWorkerWHwnd;
        target.PreferredReason = source.PreferredReason;
        target.WorkerWCandidates.AddRange(source.WorkerWCandidates);
        target.Warnings.AddRange(source.Warnings);
        target.Errors.AddRange(source.Errors);
    }

    private static void TryRestore(IntPtr hwnd, IntPtr previousParent, IntPtr previousStyle, IntPtr previousExStyle)
    {
        if (previousParent != IntPtr.Zero && Win32.IsWindow(previousParent))
        {
            Win32.SetParent(hwnd, previousParent);
        }

        Win32.SetWindowLongPtr(hwnd, Win32.GwlStyle, previousStyle);
        Win32.SetWindowLongPtr(hwnd, Win32.GwlExStyle, previousExStyle);
    }

    private static IntPtr ParseHwnd(string? hwndText)
    {
        if (string.IsNullOrWhiteSpace(hwndText))
        {
            return IntPtr.Zero;
        }

        var normalized = hwndText.StartsWith("0x", StringComparison.OrdinalIgnoreCase)
            ? hwndText[2..]
            : hwndText;
        var numberStyle = hwndText.StartsWith("0x", StringComparison.OrdinalIgnoreCase)
            ? System.Globalization.NumberStyles.HexNumber
            : System.Globalization.NumberStyles.Integer;

        return long.TryParse(normalized, numberStyle, System.Globalization.CultureInfo.InvariantCulture, out var value)
            ? new IntPtr(value)
            : IntPtr.Zero;
    }
}
