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
    public List<WorkerWindowCandidate> WorkerWCandidates { get; } = [];
    public int WorkerWCandidateCount => WorkerWCandidates.Count;
    public string? PreferredWorkerWHwnd { get; set; }
    public string? PreferredReason { get; set; }
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
    public string Title { get; set; } = string.Empty;
    public bool Visible { get; set; }
    public object? Rect { get; set; }
    public bool HasShellDllDefView { get; set; }
    public string CandidateReason { get; set; } = string.Empty;
}

internal sealed class WallpaperAttachResult : DesktopDiscoveryResult
{
    public string Backend { get; set; } = "fallback_stage";
    public string? WorkerWHwnd { get; set; }
    public string? PreviousParentHwnd { get; set; }
    public string? PreviousStyle { get; set; }
    public string? PreviousExStyle { get; set; }
    public string? NewStyle { get; set; }
    public string? NewExStyle { get; set; }
    public bool StyleAdjusted { get; set; }
    public bool SetParentSucceeded { get; set; }
    public bool SetWindowPosSucceeded { get; set; }
    public object? Position { get; set; }
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
