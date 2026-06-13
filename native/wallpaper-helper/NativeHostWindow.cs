using System.Runtime.InteropServices;
using System.Text.Json;

namespace WallpaperHelper;

internal sealed class NativeHostWindow
{
    private const string HostClassName = "DesktopMuseIdleWallpaperHost";
    private static readonly Win32.WndProc HostWindowProc = WindowProc;
    private static NativeHostWindow? currentHost;

    private readonly IntPtr childHwnd;
    private readonly IntPtr hostHwnd;
    private readonly IntPtr previousExStyle;
    private readonly IntPtr previousParent;
    private readonly IntPtr previousStyle;
    private bool cleanedUp;

    private NativeHostWindow(
        IntPtr hostHwnd,
        IntPtr childHwnd,
        IntPtr previousParent,
        IntPtr previousStyle,
        IntPtr previousExStyle)
    {
        this.hostHwnd = hostHwnd;
        this.childHwnd = childHwnd;
        this.previousParent = previousParent;
        this.previousStyle = previousStyle;
        this.previousExStyle = previousExStyle;
    }

    internal static int Run(string helperVersion, string hwndText)
    {
        var result = CreateResult(helperVersion, hwndText);
        if (!OperatingSystem.IsWindows())
        {
            result.Reason = "unsupported_platform";
            result.Errors.Add("Native host mode is only available on Windows.");
            WriteJson(result);
            return 1;
        }

        var childHwnd = Win32.ParseHwnd(hwndText);
        if (childHwnd == IntPtr.Zero || !Win32.IsWindow(childHwnd))
        {
            result.Reason = "target_window_not_found";
            result.Errors.Add("Target HWND is missing or invalid.");
            WriteJson(result);
            return 1;
        }

        var startupCleanup = CleanupStaleHostWindows();
        ApplyCleanupDiagnostics(result, startupCleanup);
        var discovery = DesktopWindowFinder.FindDesktop(helperVersion, "host");
        WallpaperAttacher.CopyDiscovery(result, discovery);
        if (string.IsNullOrWhiteSpace(discovery.PreferredWorkerWHwnd))
        {
            var progmanChildWorkerW = DesktopWindowFinder.GetBestProgmanChildWorkerW(discovery);
            if (progmanChildWorkerW is not null)
            {
                return RunWorkerWNativeHostProbe(
                    helperVersion,
                    hwndText,
                    childHwnd,
                    discovery,
                    progmanChildWorkerW,
                    startupCleanup,
                    isProgmanChildWorkerW: true);
            }

            var workerWProbeCandidate = DesktopWindowFinder.GetBestWorkerWProbeCandidate(discovery);
            if (workerWProbeCandidate is not null)
            {
                return RunWorkerWNativeHostProbe(
                    helperVersion,
                    hwndText,
                    childHwnd,
                    discovery,
                    workerWProbeCandidate,
                    startupCleanup,
                    isProgmanChildWorkerW: false);
            }

            if (CanAttemptProgmanNativeHostProbe(discovery))
            {
                return RunProgmanNativeHostProbe(helperVersion, hwndText, childHwnd, discovery, startupCleanup);
            }

            result.Reason = "workerw_not_found";
            result.Errors.Add("Desktop-sized WorkerW candidate was not found.");
            WriteJson(result);
            return 1;
        }

        var workerW = Win32.ParseHwnd(discovery.PreferredWorkerWHwnd);
        if (workerW == IntPtr.Zero || !Win32.IsWindow(workerW))
        {
            result.Reason = "workerw_invalid";
            result.Errors.Add("Preferred WorkerW candidate is not a valid window.");
            WriteJson(result);
            return 1;
        }

        var targetCandidate = discovery.WorkerWCandidates.FirstOrDefault((candidate) =>
            string.Equals(candidate.Hwnd, discovery.PreferredWorkerWHwnd, StringComparison.Ordinal));
        var width = Math.Max(1, targetCandidate?.Rect?.Width ?? Win32.GetSystemMetrics(Win32.SmCxScreen));
        var height = Math.Max(1, targetCandidate?.Rect?.Height ?? Win32.GetSystemMetrics(Win32.SmCyScreen));

        if (!RegisterHostClass())
        {
            result.Reason = "register_host_class_failed";
            result.Errors.Add($"RegisterClassEx failed: {Win32.GetLastError()}");
            WriteJson(result);
            return 1;
        }

        var instance = Win32.GetModuleHandle(null);
        var hostHwnd = Win32.CreateWindowEx(
            Win32.WsExToolWindow | Win32.WsExNoActivate,
            HostClassName,
            "Desktop Muse Idle Wallpaper Host",
            Win32.WsChild | Win32.WsVisible | Win32.WsClipChildren | Win32.WsClipSiblings,
            0,
            0,
            width,
            height,
            workerW,
            IntPtr.Zero,
            instance,
            IntPtr.Zero);

        if (hostHwnd == IntPtr.Zero)
        {
            result.Reason = "create_host_window_failed";
            result.Errors.Add($"CreateWindowEx failed: {Win32.GetLastError()}");
            WriteJson(result);
            return 1;
        }

        var previousParent = Win32.GetParent(childHwnd);
        var previousStyle = Win32.GetWindowLongPtr(childHwnd, Win32.GwlStyle);
        var previousExStyle = Win32.GetWindowLongPtr(childHwnd, Win32.GwlExStyle);
        var nativeExStyleBeforeClickThrough = Win32.GetWindowLongPtr(hostHwnd, Win32.GwlExStyle);
        Win32.SetWindowLongPtr(
            hostHwnd,
            Win32.GwlExStyle,
            new IntPtr(nativeExStyleBeforeClickThrough.ToInt64() |
                Win32.WsExToolWindow |
                Win32.WsExNoActivate |
                Win32.WsExTransparent));
        var nativeExStyleAfterClickThrough = Win32.GetWindowLongPtr(hostHwnd, Win32.GwlExStyle);
        var host = new NativeHostWindow(hostHwnd, childHwnd, previousParent, previousStyle, previousExStyle);
        currentHost = host;
        AppDomain.CurrentDomain.ProcessExit += (_, _) => host.Cleanup();
        Console.CancelKeyPress += (_, eventArgs) =>
        {
            eventArgs.Cancel = true;
            host.Close();
        };

        var newStyleValue =
            (previousStyle.ToInt64() | Win32.WsChild | Win32.WsVisible | Win32.WsClipSiblings | Win32.WsClipChildren) &
            ~Win32.WsPopup;
        var newExStyleValue = previousExStyle.ToInt64() | Win32.WsExToolWindow | Win32.WsExNoActivate;
        Win32.SetWindowLongPtr(childHwnd, Win32.GwlStyle, new IntPtr(newStyleValue));
        Win32.SetWindowLongPtr(childHwnd, Win32.GwlExStyle, new IntPtr(newExStyleValue));

        var setParentResult = Win32.SetParent(childHwnd, hostHwnd);
        var parentAfterSetParent = Win32.GetParent(childHwnd);
        result.SetParentSucceeded = setParentResult != IntPtr.Zero || Win32.GetParent(childHwnd) == hostHwnd;
        if (!result.SetParentSucceeded)
        {
            result.Reason = "set_parent_to_host_failed";
            result.Errors.Add($"SetParent child-to-host failed: {Win32.GetLastError()}");
            host.Cleanup();
            Win32.DestroyWindow(hostHwnd);
            WriteJson(result);
            return 1;
        }

        result.SetWindowPosSucceeded = Win32.SetWindowPos(
            childHwnd,
            Win32.HwndBottom,
            0,
            0,
            width,
            height,
            Win32.SwpNoActivate | Win32.SwpFrameChanged | Win32.SwpShowWindow);
        if (!result.SetWindowPosSucceeded)
        {
            result.Reason = "set_window_pos_child_failed";
            result.Errors.Add($"SetWindowPos child failed: {Win32.GetLastError()}");
            host.Cleanup();
            Win32.DestroyWindow(hostHwnd);
            WriteJson(result);
            return 1;
        }

        Win32.ShowWindow(hostHwnd, Win32.SwShowNoActivate);
        Win32.ShowWindow(childHwnd, Win32.SwShowNoActivate);

        var hostWindowRect = Win32.GetRectSafe(hostHwnd);
        var wallpaperWindowRect = Win32.GetRectSafe(childHwnd);
        result.Ok = true;
        result.Attached = false;
        result.ProbeAttached = true;
        result.NeedsManualVerification = true;
        result.Reason = "workerw_native_host_probe_needs_manual_verification";
        result.Backend = "workerw_native_host_probe";
        result.ElectronWallpaperHwnd = Win32.HwndToString(childHwnd);
        result.HelperRunning = true;
        result.HostHwnd = Win32.HwndToString(hostHwnd);
        result.WorkerWNativeHostProbeHwnd = Win32.HwndToString(hostHwnd);
        result.WorkerWHwnd = Win32.HwndToString(workerW);
        result.SelectedWorkerWHwnd = Win32.HwndToString(workerW);
        result.SelectedWorkerWStrategy = DesktopWindowFinder.GetSelectedStrategyName(discovery, result.SelectedWorkerWHwnd);
        result.ParentHwndAfterSetParent = Win32.HwndToNullableString(parentAfterSetParent);
        result.HostParentHwndAfterSetParent = Win32.HwndToNullableString(Win32.GetParent(hostHwnd));
        result.ElectronParentHwndAfterSetParent = result.ParentHwndAfterSetParent;
        result.PreviousParentHwnd = previousParent == IntPtr.Zero ? null : Win32.HwndToString(previousParent);
        result.PreviousStyle = previousStyle.ToInt64().ToString();
        result.PreviousExStyle = previousExStyle.ToInt64().ToString();
        result.NewStyle = newStyleValue.ToString();
        result.NewExStyle = newExStyleValue.ToString();
        result.StyleAdjusted = true;
        result.SetParentResult = Win32.HwndToNullableString(setParentResult);
        result.ClickThroughEnabled = true;
        result.ElectronIgnoreMouseEventsRequested = true;
        result.ElectronIgnoreMouseEventsEnabled = false;
        result.NativeHostTransparentRequested = true;
        result.NativeHostTransparentEnabled = true;
        result.NativeHostNoActivateRequested = true;
        result.NativeHostNoActivateEnabled = true;
        result.HitTestTransparentIfImplemented = false;
        result.ClickThroughMode = "native_only";
        result.NativeExStyleBeforeClickThrough = Win32.IntPtrToHex(nativeExStyleBeforeClickThrough);
        result.NativeExStyleAfterClickThrough = Win32.IntPtrToHex(nativeExStyleAfterClickThrough);
        result.HostWindowRect = hostWindowRect;
        result.WallpaperWindowRect = wallpaperWindowRect;
        result.VirtualScreenRect = Win32.GetVirtualScreenRect();
        result.RectMismatch = Win32.RectMismatch(hostWindowRect, wallpaperWindowRect);
        result.Position = new { x = 0, y = 0, width, height };
        result.WorkerWNativeHostProbeResult = new
        {
            attempted = true,
            needsManualVerification = true,
            selectedWorkerWStrategy = result.SelectedWorkerWStrategy,
            selectedWorkerWHwnd = result.SelectedWorkerWHwnd,
            workerWHwnd = result.WorkerWHwnd,
            hostHwnd = result.WorkerWNativeHostProbeHwnd,
            parentHwndAfterSetParent = result.ParentHwndAfterSetParent,
            candidateRejectReason = targetCandidate?.RejectReason,
            candidateUsableForProbe = targetCandidate?.UsableForProbe,
        };
        WriteJson(result);

        _ = Task.Run(() =>
        {
            while (Console.ReadLine() is { } line)
            {
                if (string.Equals(line.Trim(), "exit", StringComparison.OrdinalIgnoreCase))
                {
                    host.Close();
                    break;
                }
            }

            host.Close();
        });

        var exitCode = RunMessageLoop();
        host.Cleanup();
        currentHost = null;
        return exitCode;
    }

    private static bool CanAttemptProgmanNativeHostProbe(DesktopDiscoveryResult discovery)
    {
        return discovery.ProgmanFound &&
            discovery.ProgmanCandidate is { IsVisible: true } progmanCandidate &&
            progmanCandidate.HasShellDllDefViewDescendant &&
            progmanCandidate.HasSysListView32 &&
            (progmanCandidate.CoversPrimaryScreen || progmanCandidate.MatchesPrimaryScreen);
    }

    private static int RunWorkerWNativeHostProbe(
        string helperVersion,
        string hwndText,
        IntPtr childHwnd,
        DesktopDiscoveryResult discovery,
        WorkerWindowCandidate workerWProbeCandidate)
    {
        return RunWorkerWNativeHostProbe(
            helperVersion,
            hwndText,
            childHwnd,
            discovery,
            workerWProbeCandidate,
            cleanupResult: null,
            isProgmanChildWorkerW: false);
    }

    private static int RunWorkerWNativeHostProbe(
        string helperVersion,
        string hwndText,
        IntPtr childHwnd,
        DesktopDiscoveryResult discovery,
        WorkerWindowCandidate workerWProbeCandidate,
        StaleHostCleanupResult? cleanupResult,
        bool isProgmanChildWorkerW)
    {
        var result = CreateResult(helperVersion, hwndText);
        WallpaperAttacher.CopyDiscovery(result, discovery);
        ApplyCleanupDiagnostics(result, cleanupResult);
        result.AttachMethod = isProgmanChildWorkerW
            ? "workerw_child_native_host_probe"
            : "workerw_native_host_probe";
        result.Backend = result.AttachMethod;
        result.NeedsManualVerification = true;
        result.SelectedWorkerWHwnd = workerWProbeCandidate.Hwnd;
        result.SelectedWorkerWStrategy = isProgmanChildWorkerW
            ? "progman_child_workerw_algorithm"
            : DesktopWindowFinder.GetSelectedStrategyName(discovery, workerWProbeCandidate.Hwnd);
        if (isProgmanChildWorkerW)
        {
            result.SelectedProgmanChildWorkerWHwnd = workerWProbeCandidate.Hwnd;
        }

        var workerW = Win32.ParseHwnd(workerWProbeCandidate.Hwnd);
        if (workerW == IntPtr.Zero || !Win32.IsWindow(workerW))
        {
            result.Reason = "workerw_native_host_probe_invalid_workerw";
            result.Errors.Add("WorkerW probe candidate is not a valid window.");
            WriteJson(result);
            return 1;
        }

        var targetScreenRect = workerWProbeCandidate.Rect ?? discovery.PrimaryScreenRect ?? Win32.GetPrimaryScreenRect();
        var targetParentClientRect = Win32.ScreenRectToClientRect(workerW, targetScreenRect) ?? new WindowRectInfo
        {
            Left = 0,
            Top = 0,
            Right = Math.Max(1, targetScreenRect.Width),
            Bottom = Math.Max(1, targetScreenRect.Height),
            Width = Math.Max(1, targetScreenRect.Width),
            Height = Math.Max(1, targetScreenRect.Height),
        };
        var width = Math.Max(1, targetParentClientRect.Width);
        var height = Math.Max(1, targetParentClientRect.Height);

        if (!RegisterHostClass())
        {
            result.Reason = "register_host_class_failed";
            result.Errors.Add($"RegisterClassEx failed: {Win32.GetLastError()}");
            WriteJson(result);
            return 1;
        }

        var instance = Win32.GetModuleHandle(null);
        var hostHwnd = Win32.CreateWindowEx(
            Win32.WsExToolWindow | Win32.WsExNoActivate | Win32.WsExTransparent,
            HostClassName,
            isProgmanChildWorkerW
                ? "Desktop Muse Idle Progman Child WorkerW Host Probe"
                : "Desktop Muse Idle WorkerW Host Probe",
            Win32.WsChild | Win32.WsVisible | Win32.WsClipChildren | Win32.WsClipSiblings,
            targetParentClientRect.Left,
            targetParentClientRect.Top,
            width,
            height,
            workerW,
            IntPtr.Zero,
            instance,
            IntPtr.Zero);

        if (hostHwnd == IntPtr.Zero)
        {
            result.Reason = isProgmanChildWorkerW
                ? "workerw_child_native_host_probe_create_failed"
                : "workerw_native_host_probe_create_failed";
            result.Errors.Add($"CreateWindowEx WorkerW host failed: {Win32.GetLastError()}");
            WriteJson(result);
            return 1;
        }

        var previousParent = Win32.GetParent(childHwnd);
        var previousStyle = Win32.GetWindowLongPtr(childHwnd, Win32.GwlStyle);
        var previousExStyle = Win32.GetWindowLongPtr(childHwnd, Win32.GwlExStyle);
        var nativeExStyleBeforeClickThrough = Win32.GetWindowLongPtr(hostHwnd, Win32.GwlExStyle);
        Win32.SetWindowLongPtr(
            hostHwnd,
            Win32.GwlExStyle,
            new IntPtr(nativeExStyleBeforeClickThrough.ToInt64() |
                Win32.WsExToolWindow |
                Win32.WsExNoActivate |
                Win32.WsExTransparent));
        var nativeExStyleAfterClickThrough = Win32.GetWindowLongPtr(hostHwnd, Win32.GwlExStyle);
        var host = new NativeHostWindow(hostHwnd, childHwnd, previousParent, previousStyle, previousExStyle);
        currentHost = host;
        AppDomain.CurrentDomain.ProcessExit += (_, _) => host.Cleanup();
        Console.CancelKeyPress += (_, eventArgs) =>
        {
            eventArgs.Cancel = true;
            host.Close();
        };

        var newStyleValue =
            (previousStyle.ToInt64() | Win32.WsChild | Win32.WsVisible | Win32.WsClipSiblings | Win32.WsClipChildren) &
            ~Win32.WsPopup;
        var newExStyleValue =
            previousExStyle.ToInt64() |
            Win32.WsExToolWindow |
            Win32.WsExNoActivate |
            Win32.WsExTransparent;
        Win32.SetWindowLongPtr(childHwnd, Win32.GwlStyle, new IntPtr(newStyleValue));
        Win32.SetWindowLongPtr(childHwnd, Win32.GwlExStyle, new IntPtr(newExStyleValue));

        var hostRectBeforeSetParent = Win32.GetRectSafe(hostHwnd);
        var setParentResult = Win32.SetParent(childHwnd, hostHwnd);
        var parentAfterSetParent = Win32.GetParent(childHwnd);
        result.SetParentSucceeded = setParentResult != IntPtr.Zero || parentAfterSetParent == hostHwnd;
        result.WallpaperRectAfterSetParent = Win32.GetRectSafe(childHwnd);
        result.HostRectAfterSetParent = Win32.GetRectSafe(hostHwnd);
        if (!result.SetParentSucceeded)
        {
            result.Reason = isProgmanChildWorkerW
                ? "workerw_child_native_host_probe_set_parent_failed"
                : "workerw_native_host_probe_set_parent_failed";
            result.Errors.Add($"SetParent child-to-WorkerW-host failed: {Win32.GetLastError()}");
            host.Cleanup();
            Win32.DestroyWindow(hostHwnd);
            WriteJson(result);
            return 1;
        }

        result.SetWindowPosSucceeded = Win32.SetWindowPos(
            childHwnd,
            Win32.HwndBottom,
            0,
            0,
            width,
            height,
            Win32.SwpNoActivate | Win32.SwpFrameChanged | Win32.SwpShowWindow);
        result.ZOrderSucceeded = Win32.SetWindowPos(
            hostHwnd,
            Win32.HwndBottom,
            targetParentClientRect.Left,
            targetParentClientRect.Top,
            width,
            height,
            Win32.SwpNoActivate | Win32.SwpFrameChanged | Win32.SwpShowWindow);
        result.ZOrderStrategy = "hwnd_bottom";
        result.ZOrderResult = result.ZOrderSucceeded ? "workerw_host_hwnd_bottom" : $"workerw_host_hwnd_bottom_failed:{Win32.GetLastError()}";

        if (!result.SetWindowPosSucceeded)
        {
            result.Reason = isProgmanChildWorkerW
                ? "workerw_child_native_host_probe_set_window_pos_failed"
                : "workerw_native_host_probe_set_window_pos_failed";
            result.Errors.Add($"SetWindowPos child failed: {Win32.GetLastError()}");
            host.Cleanup();
            Win32.DestroyWindow(hostHwnd);
            WriteJson(result);
            return 1;
        }

        Win32.ShowWindow(hostHwnd, Win32.SwShowNoActivate);
        Win32.ShowWindow(childHwnd, Win32.SwShowNoActivate);

        var hostWindowRect = Win32.GetRectSafe(hostHwnd);
        var wallpaperWindowRect = Win32.GetRectSafe(childHwnd);
        result.Ok = true;
        result.Attached = false;
        result.ProbeAttached = true;
        result.Reason = isProgmanChildWorkerW
            ? "workerw_child_native_host_probe_needs_manual_verification"
            : "workerw_native_host_probe_needs_manual_verification";
        result.Backend = isProgmanChildWorkerW
            ? "workerw_child_native_host_probe"
            : "workerw_native_host_probe";
        result.ElectronWallpaperHwnd = Win32.HwndToString(childHwnd);
        result.HelperRunning = true;
        result.HostHwnd = Win32.HwndToString(hostHwnd);
        result.WorkerWNativeHostProbeHwnd = Win32.HwndToString(hostHwnd);
        if (isProgmanChildWorkerW)
        {
            result.WorkerWChildHwnd = Win32.HwndToString(workerW);
            result.WorkerWChildNativeHostProbeHwnd = Win32.HwndToString(hostHwnd);
        }
        result.WorkerWHwnd = Win32.HwndToString(workerW);
        result.ParentHwndAfterSetParent = Win32.HwndToNullableString(parentAfterSetParent);
        result.HostParentHwndAfterSetParent = Win32.HwndToNullableString(Win32.GetParent(hostHwnd));
        result.ElectronParentHwndAfterSetParent = result.ParentHwndAfterSetParent;
        result.PreviousParentHwnd = previousParent == IntPtr.Zero ? null : Win32.HwndToString(previousParent);
        result.PreviousStyle = previousStyle.ToInt64().ToString();
        result.PreviousExStyle = previousExStyle.ToInt64().ToString();
        result.NewStyle = newStyleValue.ToString();
        result.NewExStyle = newExStyleValue.ToString();
        result.StyleAdjusted = true;
        result.SetParentResult = Win32.HwndToNullableString(setParentResult);
        result.ClickThroughEnabled = true;
        result.ElectronIgnoreMouseEventsRequested = true;
        result.ElectronIgnoreMouseEventsEnabled = false;
        result.NativeHostTransparentRequested = true;
        result.NativeHostTransparentEnabled = true;
        result.NativeHostNoActivateRequested = true;
        result.NativeHostNoActivateEnabled = true;
        result.HitTestTransparentIfImplemented = false;
        result.ClickThroughMode = "native_only";
        result.NativeExStyleBeforeClickThrough = Win32.IntPtrToHex(nativeExStyleBeforeClickThrough);
        result.NativeExStyleAfterClickThrough = Win32.IntPtrToHex(nativeExStyleAfterClickThrough);
        result.RequestedScreenRect = targetScreenRect;
        result.RequestedParentClientRect = targetParentClientRect;
        result.HostRectBeforeSetParent = hostRectBeforeSetParent;
        result.HostRectAfterSetWindowPos = Win32.GetRectSafe(hostHwnd);
        result.WallpaperRectAfterSetWindowPos = Win32.GetRectSafe(childHwnd);
        result.HostWindowRect = hostWindowRect;
        result.WallpaperWindowRect = wallpaperWindowRect;
        result.VirtualScreenRect = Win32.GetVirtualScreenRect();
        result.RectMismatch = Win32.RectMismatch(hostWindowRect, wallpaperWindowRect);
        result.CoordinateMode = "workerw_parent_client";
        result.Position = new { x = targetParentClientRect.Left, y = targetParentClientRect.Top, width, height };
        result.WorkerWNativeHostProbeResult = new
        {
            attempted = true,
            needsManualVerification = true,
            selectedWorkerWStrategy = result.SelectedWorkerWStrategy,
            selectedWorkerWHwnd = result.SelectedWorkerWHwnd,
            candidateRejectReason = workerWProbeCandidate.RejectReason,
            visibleFalseButPossibleWallpaperLayer = workerWProbeCandidate.VisibleFalseButPossibleWallpaperLayer,
            usableForProbe = workerWProbeCandidate.UsableForProbe,
            hostHwnd = result.WorkerWNativeHostProbeHwnd,
            parentHwndAfterSetParent = result.ParentHwndAfterSetParent,
            zOrderResult = result.ZOrderResult,
            clickThroughEnabled = result.ClickThroughEnabled,
        };
        if (isProgmanChildWorkerW)
        {
            result.WorkerWChildNativeHostProbeResult = new
            {
                attempted = true,
                needsManualVerification = true,
                selectedWorkerWStrategy = result.SelectedWorkerWStrategy,
                selectedWorkerWHwnd = result.SelectedWorkerWHwnd,
                selectedProgmanChildWorkerWHwnd = result.SelectedProgmanChildWorkerWHwnd,
                workerWChildHwnd = result.WorkerWChildHwnd,
                hostHwnd = result.WorkerWChildNativeHostProbeHwnd,
                electronWallpaperHwnd = result.ElectronWallpaperHwnd,
                hostParentHwndAfterSetParent = result.HostParentHwndAfterSetParent,
                electronParentHwndAfterSetParent = result.ElectronParentHwndAfterSetParent,
                hostWindowRect = result.HostWindowRect,
                wallpaperWindowRect = result.WallpaperWindowRect,
                setParentSucceeded = result.SetParentSucceeded,
                setWindowPosSucceeded = result.SetWindowPosSucceeded,
                zOrderResult = result.ZOrderResult,
                clickThroughEnabled = result.ClickThroughEnabled,
                clickThroughMode = result.ClickThroughMode,
                candidateRect = workerWProbeCandidate.Rect,
                candidateVisible = workerWProbeCandidate.IsVisible,
                candidateParentHwnd = workerWProbeCandidate.ParentHwnd,
                candidateHasShellDllDefView = workerWProbeCandidate.HasShellDllDefViewDescendant,
                candidateHasSysListView32 = workerWProbeCandidate.HasSysListView32,
                candidateCoversPrimaryScreen = workerWProbeCandidate.CoversPrimaryScreen,
                candidateScore = DesktopWindowFinder.ScoreCandidate(workerWProbeCandidate),
                candidateRejectReason = workerWProbeCandidate.RejectReason,
            };
        }
        WriteJson(result);

        _ = Task.Run(() =>
        {
            while (Console.ReadLine() is { } line)
            {
                if (string.Equals(line.Trim(), "exit", StringComparison.OrdinalIgnoreCase))
                {
                    host.Close();
                    break;
                }
            }

            host.Close();
        });

        var exitCode = RunMessageLoop();
        host.Cleanup();
        currentHost = null;
        return exitCode;
    }

    private static int RunProgmanNativeHostProbe(
        string helperVersion,
        string hwndText,
        IntPtr childHwnd,
        DesktopDiscoveryResult discovery,
        StaleHostCleanupResult? cleanupResult = null)
    {
        var result = CreateResult(helperVersion, hwndText);
        WallpaperAttacher.CopyDiscovery(result, discovery);
        ApplyCleanupDiagnostics(result, cleanupResult);
        result.AttachMethod = "progman_native_host_probe";
        result.Backend = "progman_native_host_probe";
        result.NeedsManualVerification = true;

        var progman = Win32.ParseHwnd(discovery.ProgmanHwnd);
        if (progman == IntPtr.Zero || !Win32.IsWindow(progman))
        {
            result.Reason = "progman_invalid";
            result.Errors.Add("Progman HWND is not valid for native host probe.");
            WriteJson(result);
            return 1;
        }

        var targetRect = discovery.ProgmanCandidate?.Rect ?? discovery.PrimaryScreenRect ?? Win32.GetPrimaryScreenRect();
        var targetParentClientRect = Win32.ScreenRectToClientRect(progman, targetRect) ?? new WindowRectInfo
        {
            Left = 0,
            Top = 0,
            Right = Math.Max(1, targetRect.Width),
            Bottom = Math.Max(1, targetRect.Height),
            Width = Math.Max(1, targetRect.Width),
            Height = Math.Max(1, targetRect.Height),
        };
        var width = Math.Max(1, targetParentClientRect.Width);
        var height = Math.Max(1, targetParentClientRect.Height);
        result.RequestedScreenRect = targetRect;
        result.RequestedParentClientRect = targetParentClientRect;
        result.ProgmanWindowRect = Win32.GetRectSafe(progman);
        result.ProgmanClientRect = Win32.GetClientRectSafe(progman);
        result.CoordinateMode = "progman_parent_client";
        result.ProgmanChildrenBeforeProbe.AddRange(CaptureChildWindows(progman));

        if (!RegisterHostClass())
        {
            result.Reason = "register_host_class_failed";
            result.Errors.Add($"RegisterClassEx failed: {Win32.GetLastError()}");
            WriteJson(result);
            return 1;
        }

        var instance = Win32.GetModuleHandle(null);
        var hostHwnd = Win32.CreateWindowEx(
            Win32.WsExToolWindow | Win32.WsExNoActivate | Win32.WsExTransparent,
            HostClassName,
            "Desktop Muse Idle Progman Host Probe",
            Win32.WsChild | Win32.WsVisible | Win32.WsClipChildren | Win32.WsClipSiblings,
            targetParentClientRect.Left,
            targetParentClientRect.Top,
            width,
            height,
            progman,
            IntPtr.Zero,
            instance,
            IntPtr.Zero);

        if (hostHwnd == IntPtr.Zero)
        {
            result.Reason = "progman_native_host_probe_create_failed";
            result.Errors.Add($"CreateWindowEx Progman host failed: {Win32.GetLastError()}");
            WriteJson(result);
            return 1;
        }

        var previousParent = Win32.GetParent(childHwnd);
        var previousStyle = Win32.GetWindowLongPtr(childHwnd, Win32.GwlStyle);
        var previousExStyle = Win32.GetWindowLongPtr(childHwnd, Win32.GwlExStyle);
        var nativeExStyleBeforeClickThrough = Win32.GetWindowLongPtr(hostHwnd, Win32.GwlExStyle);
        Win32.SetWindowLongPtr(
            hostHwnd,
            Win32.GwlExStyle,
            new IntPtr(nativeExStyleBeforeClickThrough.ToInt64() |
                Win32.WsExToolWindow |
                Win32.WsExNoActivate |
                Win32.WsExTransparent));
        var nativeExStyleAfterClickThrough = Win32.GetWindowLongPtr(hostHwnd, Win32.GwlExStyle);
        result.ProgmanChildrenAfterHostCreate.AddRange(CaptureChildWindows(progman));
        var host = new NativeHostWindow(hostHwnd, childHwnd, previousParent, previousStyle, previousExStyle);
        currentHost = host;
        AppDomain.CurrentDomain.ProcessExit += (_, _) => host.Cleanup();
        Console.CancelKeyPress += (_, eventArgs) =>
        {
            eventArgs.Cancel = true;
            host.Close();
        };

        var newStyleValue =
            (previousStyle.ToInt64() | Win32.WsChild | Win32.WsVisible | Win32.WsClipSiblings | Win32.WsClipChildren) &
            ~Win32.WsPopup;
        var newExStyleValue =
            previousExStyle.ToInt64() |
            Win32.WsExToolWindow |
            Win32.WsExNoActivate |
            Win32.WsExTransparent;
        Win32.SetWindowLongPtr(childHwnd, Win32.GwlStyle, new IntPtr(newStyleValue));
        Win32.SetWindowLongPtr(childHwnd, Win32.GwlExStyle, new IntPtr(newExStyleValue));

        result.HostRectBeforeSetParent = Win32.GetRectSafe(hostHwnd);
        var setParentResult = Win32.SetParent(childHwnd, hostHwnd);
        var parentAfterSetParent = Win32.GetParent(childHwnd);
        result.SetParentSucceeded = setParentResult != IntPtr.Zero || parentAfterSetParent == hostHwnd;
        result.HostRectAfterSetParent = Win32.GetRectSafe(hostHwnd);
        result.WallpaperRectAfterSetParent = Win32.GetRectSafe(childHwnd);
        result.ProgmanChildrenAfterSetParent.AddRange(CaptureChildWindows(progman));
        if (!result.SetParentSucceeded)
        {
            result.Reason = "progman_native_host_probe_set_parent_failed";
            result.Errors.Add($"SetParent child-to-Progman-host failed: {Win32.GetLastError()}");
            host.Cleanup();
            Win32.DestroyWindow(hostHwnd);
            WriteJson(result);
            return 1;
        }

        result.SetWindowPosSucceeded = Win32.SetWindowPos(
            childHwnd,
            Win32.HwndBottom,
            0,
            0,
            width,
            height,
            Win32.SwpNoActivate | Win32.SwpFrameChanged | Win32.SwpShowWindow);

        ApplyProgmanZOrderStrategies(result, progman, hostHwnd, width, height, targetParentClientRect);
        result.ProgmanChildrenAfterZOrder.AddRange(CaptureChildWindows(progman));

        if (!result.SetWindowPosSucceeded)
        {
            result.Reason = "progman_native_host_probe_set_window_pos_failed";
            result.Errors.Add($"SetWindowPos child failed: {Win32.GetLastError()}");
            host.Cleanup();
            Win32.DestroyWindow(hostHwnd);
            WriteJson(result);
            return 1;
        }

        Win32.ShowWindow(hostHwnd, Win32.SwShowNoActivate);
        Win32.ShowWindow(childHwnd, Win32.SwShowNoActivate);

        var hostWindowRect = Win32.GetRectSafe(hostHwnd);
        var wallpaperWindowRect = Win32.GetRectSafe(childHwnd);
        result.Ok = true;
        result.Attached = false;
        result.ProbeAttached = true;
        result.Reason = "progman_native_host_probe_needs_manual_verification";
        result.Backend = "progman_native_host_probe";
        result.ElectronWallpaperHwnd = Win32.HwndToString(childHwnd);
        result.HelperRunning = true;
        result.HostHwnd = Win32.HwndToString(hostHwnd);
        result.ProgmanNativeHostHwnd = Win32.HwndToString(hostHwnd);
        result.ParentHwndAfterSetParent = Win32.HwndToNullableString(parentAfterSetParent);
        result.HostParentHwndAfterSetParent = Win32.HwndToNullableString(Win32.GetParent(hostHwnd));
        result.ElectronParentHwndAfterSetParent = result.ParentHwndAfterSetParent;
        result.PreviousParentHwnd = previousParent == IntPtr.Zero ? null : Win32.HwndToString(previousParent);
        result.PreviousStyle = previousStyle.ToInt64().ToString();
        result.PreviousExStyle = previousExStyle.ToInt64().ToString();
        result.NewStyle = newStyleValue.ToString();
        result.NewExStyle = newExStyleValue.ToString();
        result.StyleAdjusted = true;
        result.SetParentResult = Win32.HwndToNullableString(setParentResult);
        result.ClickThroughEnabled = true;
        result.ElectronIgnoreMouseEventsRequested = true;
        result.ElectronIgnoreMouseEventsEnabled = false;
        result.NativeHostTransparentRequested = true;
        result.NativeHostTransparentEnabled = true;
        result.NativeHostNoActivateRequested = true;
        result.NativeHostNoActivateEnabled = true;
        result.HitTestTransparentIfImplemented = false;
        result.ClickThroughMode = "native_only";
        result.NativeExStyleBeforeClickThrough = Win32.IntPtrToHex(nativeExStyleBeforeClickThrough);
        result.NativeExStyleAfterClickThrough = Win32.IntPtrToHex(nativeExStyleAfterClickThrough);
        result.ShellDllDefViewHwnd = discovery.ShellDllDefViewHwnd;
        result.SysListView32Hwnd = discovery.SysListView32Hwnd;
        result.HostRelativeToShellDllDefView = GetRelativeOrder(
            progman,
            hostHwnd,
            Win32.ParseHwnd(discovery.ShellDllDefViewHwnd));
        result.HostRelativeToSysListView32 = GetRelativeOrder(
            progman,
            hostHwnd,
            Win32.ParseHwnd(discovery.SysListView32Hwnd));
        result.HostWindowRect = hostWindowRect;
        result.WallpaperWindowRect = wallpaperWindowRect;
        result.VirtualScreenRect = Win32.GetVirtualScreenRect();
        result.RectMismatch = Win32.RectMismatch(hostWindowRect, wallpaperWindowRect);
        result.HostRectAfterSetWindowPos = Win32.GetRectSafe(hostHwnd);
        result.WallpaperRectAfterSetWindowPos = Win32.GetRectSafe(childHwnd);
        result.Position = new { x = targetParentClientRect.Left, y = targetParentClientRect.Top, width, height };
        result.ProgmanNativeHostProbeResult = new
        {
            attempted = true,
            needsManualVerification = true,
            progmanHwnd = discovery.ProgmanHwnd,
            progmanHasShellDllDefView = discovery.ProgmanHasShellDllDefView,
            progmanHasSysListView32 = discovery.ProgmanHasSysListView32,
            progmanCoversPrimaryScreen = discovery.ProgmanCoversPrimaryScreen,
            hostHwnd = result.ProgmanNativeHostHwnd,
            hostParentHwndAfterSetParent = result.HostParentHwndAfterSetParent,
            electronParentHwndAfterSetParent = result.ElectronParentHwndAfterSetParent,
            zOrderResult = result.ZOrderResult,
            zOrderStrategy = result.ZOrderStrategy,
            hostRelativeToShellDllDefView = result.HostRelativeToShellDllDefView,
            hostRelativeToSysListView32 = result.HostRelativeToSysListView32,
            clickThroughEnabled = result.ClickThroughEnabled,
            coordinateMode = result.CoordinateMode,
        };
        WriteJson(result);

        _ = Task.Run(() =>
        {
            while (Console.ReadLine() is { } line)
            {
                if (string.Equals(line.Trim(), "exit", StringComparison.OrdinalIgnoreCase))
                {
                    host.Close();
                    break;
                }
            }

            host.Close();
        });

        var exitCode = RunMessageLoop();
        host.Cleanup();
        currentHost = null;
        return exitCode;
    }

    internal static WallpaperInspectResult Inspect(
        string helperVersion,
        string? wallpaperHwndText,
        string? hostHwndText,
        string? workerWHwndText)
    {
        var wallpaperHwnd = Win32.ParseHwnd(wallpaperHwndText);
        var hostHwnd = Win32.ParseHwnd(hostHwndText);
        var workerWHwnd = Win32.ParseHwnd(workerWHwndText);
        var result = new WallpaperInspectResult
        {
            HelperVersion = helperVersion,
            Hwnd = wallpaperHwndText,
            ElectronWallpaperHwnd = wallpaperHwndText,
            HostHwnd = hostHwndText,
            WorkerWHwnd = workerWHwndText,
            VirtualScreenRect = Win32.GetVirtualScreenRect(),
        };

        if (!OperatingSystem.IsWindows())
        {
            result.Reason = "unsupported_platform";
            result.Errors.Add("Native wallpaper inspection is only available on Windows.");
            return result;
        }

        result.WallpaperWindowAlive = wallpaperHwnd != IntPtr.Zero && Win32.IsWindow(wallpaperHwnd);
        result.HostWindowAlive = hostHwnd != IntPtr.Zero && Win32.IsWindow(hostHwnd);
        result.WorkerWAlive = workerWHwnd != IntPtr.Zero && Win32.IsWindow(workerWHwnd);
        result.ParentHwndAfterSetParent = result.WallpaperWindowAlive
            ? Win32.HwndToNullableString(Win32.GetParent(wallpaperHwnd))
            : null;
        result.HostWindowRect = result.HostWindowAlive ? Win32.GetRectSafe(hostHwnd) : null;
        result.WallpaperWindowRect = result.WallpaperWindowAlive ? Win32.GetRectSafe(wallpaperHwnd) : null;
        result.RectMismatch = Win32.RectMismatch(result.HostWindowRect, result.WallpaperWindowRect);

        if (!result.WallpaperWindowAlive)
        {
            result.Reason = "wallpaper_window_missing";
            result.Errors.Add("Electron Wallpaper HWND is no longer a valid window.");
            return result;
        }

        if (!result.HostWindowAlive)
        {
            result.Reason = "native_host_window_missing";
            result.Errors.Add("Native host HWND is no longer a valid window.");
            return result;
        }

        if (!result.WorkerWAlive)
        {
            result.Reason = "workerw_missing";
            result.Errors.Add("WorkerW HWND is no longer a valid window.");
            return result;
        }

        if (!string.Equals(result.ParentHwndAfterSetParent, result.HostHwnd, StringComparison.Ordinal))
        {
            result.Reason = "wallpaper_parent_mismatch";
            result.Errors.Add("Electron Wallpaper HWND is not parented to the native host HWND.");
            return result;
        }

        if (result.RectMismatch)
        {
            result.Warnings.Add("Native host and Electron Wallpaper rectangles differ.");
        }

        result.Ok = true;
        result.Attached = true;
        result.Backend = "native_desktop_wallpaper";
        return result;
    }

    private static WallpaperAttachResult CreateResult(string helperVersion, string hwnd)
    {
        return new WallpaperAttachResult
        {
            AttachMethod = "native_host_window",
            Attached = false,
            Backend = "fallback_stage",
            Command = "host",
            HelperVersion = helperVersion,
            Hwnd = hwnd,
            Ok = false,
        };
    }

    private static bool RegisterHostClass()
    {
        var instance = Win32.GetModuleHandle(null);
        var windowClass = new Win32.WndClassEx
        {
            CbSize = (uint)Marshal.SizeOf<Win32.WndClassEx>(),
            HInstance = instance,
            LpfnWndProc = HostWindowProc,
            LpszClassName = HostClassName,
        };

        var atom = Win32.RegisterClassEx(ref windowClass);
        return atom != 0 || Win32.GetLastError() == 1410;
    }

    private static StaleHostCleanupResult CleanupStaleHostWindows()
    {
        var result = new StaleHostCleanupResult();
        var progman = Win32.FindWindow("Progman", null);
        if (progman == IntPtr.Zero || !Win32.IsWindow(progman))
        {
            return result;
        }

        result.StaleHostWindowsBeforeCleanup.AddRange(CaptureStaleHostWindows(progman));
        if (result.StaleHostWindowsBeforeCleanup.Count == 0)
        {
            result.ProgmanChildrenAfterCleanup.AddRange(CaptureChildWindows(progman));
            result.Succeeded = true;
            return result;
        }

        result.Attempted = true;
        foreach (var staleHost in result.StaleHostWindowsBeforeCleanup)
        {
            var staleHwnd = Win32.ParseHwnd(staleHost.Hwnd);
            if (staleHwnd == IntPtr.Zero || !Win32.IsWindow(staleHwnd))
            {
                continue;
            }

            Win32.PostMessage(staleHwnd, Win32.WmClose, UIntPtr.Zero, IntPtr.Zero);
        }

        Thread.Sleep(150);
        var remaining = CaptureStaleHostWindows(progman);
        foreach (var staleHost in remaining)
        {
            var staleHwnd = Win32.ParseHwnd(staleHost.Hwnd);
            if (staleHwnd != IntPtr.Zero && Win32.IsWindow(staleHwnd))
            {
                Win32.DestroyWindow(staleHwnd);
            }
        }

        Thread.Sleep(50);
        result.ProgmanChildrenAfterCleanup.AddRange(CaptureChildWindows(progman));
        var stillRemaining = CaptureStaleHostWindows(progman);
        result.Succeeded = stillRemaining.Count == 0;
        result.Failed = !result.Succeeded;
        return result;
    }

    private static void ApplyCleanupDiagnostics(
        WallpaperAttachResult result,
        StaleHostCleanupResult? cleanupResult)
    {
        if (cleanupResult is null)
        {
            return;
        }

        result.StaleHostWindowsBeforeCleanup.AddRange(cleanupResult.StaleHostWindowsBeforeCleanup);
        result.ProgmanChildrenAfterCleanup.AddRange(cleanupResult.ProgmanChildrenAfterCleanup);
        result.CleanupStaleHostWindowsAttempted = cleanupResult.Attempted;
        result.CleanupStaleHostWindowsSucceeded = cleanupResult.Succeeded;
        result.CleanupStaleHostWindowsFailed = cleanupResult.Failed;
        if (cleanupResult.Failed)
        {
            result.Warnings.Add("Stale DesktopMuseIdleWallpaperHost windows remained after startup cleanup.");
        }
    }

    private static List<DesktopChildWindowInfo> CaptureStaleHostWindows(IntPtr progman)
    {
        return CaptureChildWindows(progman)
            .Where((child) =>
                string.Equals(child.ClassName, HostClassName, StringComparison.Ordinal) ||
                child.WindowText.StartsWith("Desktop Muse Idle", StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    private static void ApplyProgmanZOrderStrategies(
        WallpaperAttachResult result,
        IntPtr progman,
        IntPtr hostHwnd,
        int width,
        int height,
        WindowRectInfo targetParentClientRect)
    {
        var shellDllDefView = Win32.ParseHwnd(result.ShellDllDefViewHwnd);
        var sysListView32 = Win32.ParseHwnd(result.SysListView32Hwnd);
        var strategies = new (string Name, Func<bool> Apply)[]
        {
            ("hwnd_bottom", () => Win32.SetWindowPos(
                hostHwnd,
                Win32.HwndBottom,
                targetParentClientRect.Left,
                targetParentClientRect.Top,
                width,
                height,
                Win32.SwpNoActivate | Win32.SwpFrameChanged | Win32.SwpShowWindow)),
            ("behind_shell_dll_defview", () => shellDllDefView != IntPtr.Zero && Win32.SetWindowPos(
                hostHwnd,
                shellDllDefView,
                targetParentClientRect.Left,
                targetParentClientRect.Top,
                width,
                height,
                Win32.SwpNoActivate | Win32.SwpFrameChanged | Win32.SwpShowWindow)),
            ("before_shell_dll_defview", () => shellDllDefView != IntPtr.Zero && Win32.SetWindowPos(
                shellDllDefView,
                hostHwnd,
                0,
                0,
                0,
                0,
                Win32.SwpNoActivate | Win32.SwpNoMove | Win32.SwpNoSize)),
            ("shell_dll_defview_top_after_host", () => shellDllDefView != IntPtr.Zero && Win32.SetWindowPos(
                shellDllDefView,
                Win32.HwndTop,
                0,
                0,
                0,
                0,
                Win32.SwpNoActivate | Win32.SwpNoMove | Win32.SwpNoSize)),
            ("syslistview_top_after_host", () => sysListView32 != IntPtr.Zero && Win32.SetWindowPos(
                sysListView32,
                Win32.HwndTop,
                0,
                0,
                0,
                0,
                Win32.SwpNoActivate | Win32.SwpNoMove | Win32.SwpNoSize)),
        };

        foreach (var strategy in strategies)
        {
            var succeeded = strategy.Apply();
            var error = succeeded ? null : Win32.GetLastError().ToString();
            result.ZOrderStrategyResults.Add(new ZOrderStrategyResult
            {
                ZOrderStrategy = strategy.Name,
                ZOrderSucceeded = succeeded,
                ZOrderError = error,
                HostRelativeToShellDllDefView = GetRelativeOrder(progman, hostHwnd, shellDllDefView),
                HostRelativeToSysListView32 = GetRelativeOrder(progman, hostHwnd, sysListView32),
                ManualVerificationRequired = true,
            });
            result.ZOrderStrategy = strategy.Name;
            result.ZOrderSucceeded = succeeded;
            result.ZOrderResult = succeeded ? strategy.Name : $"{strategy.Name}_failed:{error}";
        }
    }

    private static List<DesktopChildWindowInfo> CaptureChildWindows(IntPtr parentHwnd)
    {
        var children = Win32.EnumerateChildWindows(parentHwnd);
        return children.Select((child, index) => new DesktopChildWindowInfo
        {
            Index = index,
            Hwnd = Win32.HwndToString(child),
            ClassName = Win32.GetClassNameSafe(child),
            WindowText = Win32.GetWindowTextSafe(child),
            ParentHwnd = Win32.HwndToNullableString(Win32.GetParent(child)),
            IsVisible = Win32.IsWindowVisible(child),
            Rect = Win32.GetRectSafe(child),
            HasShellDllDefViewDescendant = Win32.HasDescendantWindow(child, "SHELLDLL_DefView"),
            HasSysListView32 = Win32.HasDescendantWindow(child, "SysListView32"),
        }).ToList();
    }

    private static string GetRelativeOrder(IntPtr expectedParent, IntPtr hostHwnd, IntPtr targetHwnd)
    {
        if (hostHwnd == IntPtr.Zero)
        {
            return "host_missing";
        }

        if (targetHwnd == IntPtr.Zero || !Win32.IsWindow(targetHwnd))
        {
            return "target_missing";
        }

        if (Win32.GetParent(hostHwnd) != expectedParent || Win32.GetParent(targetHwnd) != expectedParent)
        {
            return $"not_siblings:hostParent={Win32.HwndToNullableString(Win32.GetParent(hostHwnd))}:targetParent={Win32.HwndToNullableString(Win32.GetParent(targetHwnd))}";
        }

        var children = Win32.EnumerateChildWindows(expectedParent);
        var hostIndex = children.FindIndex((hwnd) => hwnd == hostHwnd);
        var targetIndex = children.FindIndex((hwnd) => hwnd == targetHwnd);
        if (hostIndex < 0 || targetIndex < 0)
        {
            return $"not_in_child_order:hostIndex={hostIndex}:targetIndex={targetIndex}";
        }

        if (hostIndex == targetIndex)
        {
            return "same_window";
        }

        return hostIndex < targetIndex
            ? $"host_before_target:index={hostIndex}:target={targetIndex}"
            : $"host_after_target:index={hostIndex}:target={targetIndex}";
    }

    private static int RunMessageLoop()
    {
        while (Win32.GetMessage(out var message, IntPtr.Zero, 0, 0) > 0)
        {
            Win32.TranslateMessage(ref message);
            Win32.DispatchMessage(ref message);
        }

        return 0;
    }

    private static void WriteJson(object payload)
    {
        Console.WriteLine(JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
        Console.Out.Flush();
    }

    private static IntPtr WindowProc(IntPtr hWnd, uint msg, UIntPtr wParam, IntPtr lParam)
    {
        if (msg == Win32.WmClose)
        {
            currentHost?.Cleanup();
            Win32.DestroyWindow(hWnd);
            return IntPtr.Zero;
        }

        if (msg == Win32.WmDestroy)
        {
            Win32.PostQuitMessage(0);
            return IntPtr.Zero;
        }

        return Win32.DefWindowProc(hWnd, msg, wParam, lParam);
    }

    private void Close()
    {
        if (hostHwnd != IntPtr.Zero && Win32.IsWindow(hostHwnd))
        {
            Win32.PostMessage(hostHwnd, Win32.WmClose, UIntPtr.Zero, IntPtr.Zero);
        }
    }

    private void Cleanup()
    {
        if (cleanedUp)
        {
            return;
        }

        cleanedUp = true;
        if (childHwnd != IntPtr.Zero && Win32.IsWindow(childHwnd))
        {
            WallpaperAttacher.TryRestore(childHwnd, previousParent, previousStyle, previousExStyle);
        }
    }
}
