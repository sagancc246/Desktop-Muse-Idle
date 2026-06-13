namespace WallpaperHelper;

internal class DesktopDiscoveryResult
{
    public bool Ok { get; set; }
    public string Command { get; set; } = "find-desktop";
    public string HelperVersion { get; set; } = string.Empty;
    public bool ProgmanFound { get; set; }
    public string? ProgmanHwnd { get; set; }
    public bool WorkerWMessageSent { get; set; }
    public string? WorkerWMessageResult { get; set; }
    public bool ShellDllDefViewFound { get; set; }
    public WorkerWindowCandidate? ProgmanCandidate { get; set; }
    public bool ProgmanHasShellDllDefView { get; set; }
    public bool ProgmanHasSysListView32 { get; set; }
    public bool ProgmanCoversPrimaryScreen { get; set; }
    public string? ShellDllDefViewHwnd { get; set; }
    public string? SysListView32Hwnd { get; set; }
    public WindowRectInfo? PrimaryScreenRect { get; set; }
    public WindowRectInfo? VirtualScreenRect { get; set; }
    public List<WorkerWDiscoveryStrategy> WorkerWDiscoveryStrategies { get; } = [];
    public List<WorkerWindowCandidate> ProgmanChildWorkerWCandidates { get; } = [];
    public string? SelectedProgmanChildWorkerWHwnd { get; set; }
    public List<WorkerWindowCandidate> WorkerWCandidatesBeforeMessage { get; } = [];
    public int WorkerWCandidateCountBeforeMessage => WorkerWCandidatesBeforeMessage.Count;
    public List<WorkerWindowCandidate> WorkerWCandidates { get; } = [];
    public int WorkerWCandidateCount => WorkerWCandidates.Count;
    public List<string> WorkerWCreatedHwnds { get; } = [];
    public List<string> WorkerWRemovedHwnds { get; } = [];
    public List<WorkerWindowSelectionEntry> WorkerWSelectionOrder { get; } = [];
    public string? PreferredWorkerWHwnd { get; set; }
    public string? PreferredReason { get; set; }
    public string? ClosestWorkerWHwnd { get; set; }
    public string? ClosestWorkerWReason { get; set; }
    public bool DryRun { get; set; }
    public bool Attached { get; set; }
    public string? Hwnd { get; set; }
    public string? Reason { get; set; }
    public List<string> Warnings { get; } = [];
    public List<string> Errors { get; } = [];
}

internal sealed class WorkerWindowCandidate
{
    public string Hwnd { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string WindowText { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ParentHwnd { get; set; }
    public string? OwnerHwnd { get; set; }
    public uint ProcessId { get; set; }
    public string Style { get; set; } = string.Empty;
    public string ExStyle { get; set; } = string.Empty;
    public bool IsVisible { get; set; }
    public bool Visible { get; set; }
    public WindowRectInfo? Rect { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public MonitorInfo? Monitor { get; set; }
    public bool MatchesVirtualScreen { get; set; }
    public bool MatchesPrimaryScreen { get; set; }
    public bool CoversVirtualScreen { get; set; }
    public bool CoversPrimaryScreen { get; set; }
    public bool HasShellDllDefView { get; set; }
    public bool HasShellDllDefViewDescendant { get; set; }
    public bool HasSysListView32 { get; set; }
    public string CandidateReason { get; set; } = string.Empty;
    public string RejectReason { get; set; } = string.Empty;
    public string AttachRejectReason { get; set; } = string.Empty;
    public bool RejectedForAttach { get; set; }
    public bool UsableForProbe { get; set; }
    public bool VisibleFalseButPossibleWallpaperLayer { get; set; }
    public bool EmptyRect { get; set; }
    public bool TooSmall { get; set; }
    public bool NoShellDllDefViewRelation { get; set; }
    public bool NoDesktopSizeMatch { get; set; }
    public int SelectionRank { get; set; }
    public string SelectionReason { get; set; } = string.Empty;
}

internal sealed class WorkerWDiscoveryStrategy
{
    public string StrategyName { get; set; } = string.Empty;
    public bool Found { get; set; }
    public string? CandidateHwnd { get; set; }
    public string CandidateClassName { get; set; } = string.Empty;
    public string? ShellDllDefViewHwnd { get; set; }
    public string? ShellDllDefViewParentHwnd { get; set; }
    public string? SysListView32Hwnd { get; set; }
    public string? NextSiblingWorkerWHwnd { get; set; }
    public string? PreviousSiblingWorkerWHwnd { get; set; }
    public string? FindWindowExWorkerWResult { get; set; }
    public WindowRectInfo? CandidateRect { get; set; }
    public bool CandidateVisible { get; set; }
    public string CandidateStyle { get; set; } = string.Empty;
    public string CandidateExStyle { get; set; } = string.Empty;
    public uint CandidateProcessId { get; set; }
    public string CandidateRejectReason { get; set; } = string.Empty;
    public int CandidateScore { get; set; }
    public bool SelectedByStrategy { get; set; }
}

internal sealed class WorkerWindowSelectionEntry
{
    public int Rank { get; set; }
    public string Hwnd { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string RejectReason { get; set; } = string.Empty;
    public string SelectionReason { get; set; } = string.Empty;
    public int Score { get; set; }
}

internal sealed class WindowRectInfo
{
    public int Left { get; set; }
    public int Top { get; set; }
    public int Right { get; set; }
    public int Bottom { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
}

internal sealed class MonitorInfo
{
    public string Hwnd { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public WindowRectInfo? MonitorRect { get; set; }
    public WindowRectInfo? WorkRect { get; set; }
}

internal sealed class WallpaperAttachResult : DesktopDiscoveryResult
{
    public string? AttachMethod { get; set; }
    public string Backend { get; set; } = "fallback_stage";
    public string? ElectronWallpaperHwnd { get; set; }
    public bool HelperRunning { get; set; }
    public string? HostHwnd { get; set; }
    public string? ProgmanNativeHostHwnd { get; set; }
    public string? WorkerWHwnd { get; set; }
    public string? ParentHwndAfterSetParent { get; set; }
    public string? PreviousParentHwnd { get; set; }
    public string? PreviousStyle { get; set; }
    public string? PreviousExStyle { get; set; }
    public string? NewStyle { get; set; }
    public string? NewExStyle { get; set; }
    public bool StyleAdjusted { get; set; }
    public string? SetParentResult { get; set; }
    public bool SetParentSucceeded { get; set; }
    public bool SetWindowPosSucceeded { get; set; }
    public bool ZOrderSucceeded { get; set; }
    public string? ZOrderResult { get; set; }
    public string? ZOrderStrategy { get; set; }
    public List<ZOrderStrategyResult> ZOrderStrategyResults { get; } = [];
    public bool ProbeAttached { get; set; }
    public bool NeedsManualVerification { get; set; }
    public string? SelectedWorkerWStrategy { get; set; }
    public string? SelectedWorkerWHwnd { get; set; }
    public string? WorkerWNativeHostProbeHwnd { get; set; }
    public string? WorkerWChildHwnd { get; set; }
    public string? WorkerWChildNativeHostProbeHwnd { get; set; }
    public object? ProgmanNativeHostProbeResult { get; set; }
    public object? WorkerWNativeHostProbeResult { get; set; }
    public object? WorkerWChildNativeHostProbeResult { get; set; }
    public List<DesktopChildWindowInfo> StaleHostWindowsBeforeCleanup { get; } = [];
    public List<DesktopChildWindowInfo> ProgmanChildrenAfterCleanup { get; } = [];
    public bool CleanupStaleHostWindowsAttempted { get; set; }
    public bool CleanupStaleHostWindowsSucceeded { get; set; }
    public bool CleanupStaleHostWindowsFailed { get; set; }
    public List<DesktopChildWindowInfo> ProgmanChildrenBeforeProbe { get; } = [];
    public List<DesktopChildWindowInfo> ProgmanChildrenAfterHostCreate { get; } = [];
    public List<DesktopChildWindowInfo> ProgmanChildrenAfterSetParent { get; } = [];
    public List<DesktopChildWindowInfo> ProgmanChildrenAfterZOrder { get; } = [];
    public string? HostParentHwndAfterSetParent { get; set; }
    public string? ElectronParentHwndAfterSetParent { get; set; }
    public string? HostRelativeToShellDllDefView { get; set; }
    public string? HostRelativeToSysListView32 { get; set; }
    public bool ClickThroughEnabled { get; set; }
    public bool ElectronIgnoreMouseEventsRequested { get; set; }
    public bool ElectronIgnoreMouseEventsEnabled { get; set; }
    public bool NativeHostTransparentRequested { get; set; }
    public bool NativeHostTransparentEnabled { get; set; }
    public bool NativeHostNoActivateRequested { get; set; }
    public bool NativeHostNoActivateEnabled { get; set; }
    public string? NativeExStyleBeforeClickThrough { get; set; }
    public string? NativeExStyleAfterClickThrough { get; set; }
    public bool HitTestTransparentIfImplemented { get; set; }
    public string ClickThroughMode { get; set; } = "none";
    public WindowRectInfo? RequestedScreenRect { get; set; }
    public WindowRectInfo? RequestedParentClientRect { get; set; }
    public WindowRectInfo? ProgmanWindowRect { get; set; }
    public WindowRectInfo? ProgmanClientRect { get; set; }
    public WindowRectInfo? HostRectBeforeSetParent { get; set; }
    public WindowRectInfo? HostRectAfterSetParent { get; set; }
    public WindowRectInfo? HostRectAfterSetWindowPos { get; set; }
    public WindowRectInfo? WallpaperRectAfterSetParent { get; set; }
    public WindowRectInfo? WallpaperRectAfterSetWindowPos { get; set; }
    public string? CoordinateMode { get; set; }
    public bool RestoredAfterProbe { get; set; }
    public WindowRectInfo? HostWindowRect { get; set; }
    public WindowRectInfo? WallpaperWindowRect { get; set; }
    public bool RectMismatch { get; set; }
    public object? Position { get; set; }
}

internal sealed class DesktopChildWindowInfo
{
    public int Index { get; set; }
    public string Hwnd { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string WindowText { get; set; } = string.Empty;
    public string? ParentHwnd { get; set; }
    public bool IsVisible { get; set; }
    public WindowRectInfo? Rect { get; set; }
    public bool HasShellDllDefViewDescendant { get; set; }
    public bool HasSysListView32 { get; set; }
}

internal sealed class StaleHostCleanupResult
{
    public List<DesktopChildWindowInfo> StaleHostWindowsBeforeCleanup { get; } = [];
    public List<DesktopChildWindowInfo> ProgmanChildrenAfterCleanup { get; } = [];
    public bool Attempted { get; set; }
    public bool Succeeded { get; set; }
    public bool Failed { get; set; }
}

internal sealed class ZOrderStrategyResult
{
    public string ZOrderStrategy { get; set; } = string.Empty;
    public bool ZOrderSucceeded { get; set; }
    public string? ZOrderError { get; set; }
    public string? HostRelativeToShellDllDefView { get; set; }
    public string? HostRelativeToSysListView32 { get; set; }
    public bool ManualVerificationRequired { get; set; }
}

internal sealed class WallpaperInspectResult
{
    public bool Ok { get; set; }
    public string Command { get; set; } = "inspect";
    public string HelperVersion { get; set; } = string.Empty;
    public bool Attached { get; set; }
    public string Backend { get; set; } = "fallback_stage";
    public string? Reason { get; set; }
    public string? Hwnd { get; set; }
    public string? ElectronWallpaperHwnd { get; set; }
    public string? HostHwnd { get; set; }
    public string? WorkerWHwnd { get; set; }
    public bool WallpaperWindowAlive { get; set; }
    public bool HostWindowAlive { get; set; }
    public bool WorkerWAlive { get; set; }
    public string? ParentHwndAfterSetParent { get; set; }
    public WindowRectInfo? HostWindowRect { get; set; }
    public WindowRectInfo? WallpaperWindowRect { get; set; }
    public WindowRectInfo? VirtualScreenRect { get; set; }
    public bool RectMismatch { get; set; }
    public List<string> Warnings { get; } = [];
    public List<string> Errors { get; } = [];
}

internal sealed class WallpaperDetachResult
{
    public bool Ok { get; set; }
    public string Command { get; set; } = "detach";
    public string HelperVersion { get; set; } = string.Empty;
    public string? Hwnd { get; set; }
    public string? PreviousParentHwnd { get; set; }
    public bool Detached { get; set; }
    public bool SetParentSucceeded { get; set; }
    public bool StyleRestored { get; set; }
    public string? Reason { get; set; }
    public List<string> Warnings { get; } = [];
    public List<string> Errors { get; } = [];
}
