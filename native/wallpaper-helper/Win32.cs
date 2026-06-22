using System.Runtime.InteropServices;
using System.Text;

namespace WallpaperHelper;

internal static class Win32
{
    internal delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lParam);
    internal delegate IntPtr WndProc(IntPtr hWnd, uint msg, UIntPtr wParam, IntPtr lParam);

    internal const uint SmtoNormal = 0x0000;
    internal const uint SmtoAbortIfHung = 0x0002;
    internal const uint WorkerWMessage = 0x052C;
    internal const uint WmClose = 0x0010;
    internal const uint WmDestroy = 0x0002;
    internal const int GwlStyle = -16;
    internal const int GwlExStyle = -20;
    internal const int SmCxScreen = 0;
    internal const int SmCyScreen = 1;
    internal const int SmXVirtualScreen = 76;
    internal const int SmYVirtualScreen = 77;
    internal const int SmCxVirtualScreen = 78;
    internal const int SmCyVirtualScreen = 79;
    internal const uint GwOwner = 4;
    internal const uint GwHwndNext = 2;
    internal const uint GwHwndPrev = 3;
    internal const uint MonitorDefaultToNearest = 0x00000002;
    internal static readonly IntPtr HwndTop = IntPtr.Zero;
    internal static readonly IntPtr HwndBottom = new(1);
    internal const int SwShowNoActivate = 4;
    internal const uint SwpNoSize = 0x0001;
    internal const uint SwpNoMove = 0x0002;
    internal const uint SwpNoZOrder = 0x0004;
    internal const uint SwpNoActivate = 0x0010;
    internal const uint SwpFrameChanged = 0x0020;
    internal const uint SwpShowWindow = 0x0040;
    internal const long WsChild = 0x40000000L;
    internal const long WsPopup = 0x80000000L;
    internal const long WsVisible = 0x10000000L;
    internal const long WsClipChildren = 0x02000000L;
    internal const long WsClipSiblings = 0x04000000L;
    internal const long WsExToolWindow = 0x00000080L;
    internal const long WsExTransparent = 0x00000020L;
    internal const long WsExNoActivate = 0x08000000L;
    internal const int ColorWindow = 5;

    [StructLayout(LayoutKind.Sequential)]
    internal struct Rect
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    internal struct Point
    {
        public int X;
        public int Y;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    internal struct WndClassEx
    {
        public uint CbSize;
        public uint Style;
        public WndProc LpfnWndProc;
        public int CbClsExtra;
        public int CbWndExtra;
        public IntPtr HInstance;
        public IntPtr HIcon;
        public IntPtr HCursor;
        public IntPtr HbrBackground;
        public string? LpszMenuName;
        public string LpszClassName;
        public IntPtr HIconSm;
    }

    [StructLayout(LayoutKind.Sequential)]
    internal struct Msg
    {
        public IntPtr Hwnd;
        public uint Message;
        public UIntPtr WParam;
        public IntPtr LParam;
        public uint Time;
        public int PtX;
        public int PtY;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    internal struct MonitorInfoEx
    {
        public int CbSize;
        public Rect RcMonitor;
        public Rect RcWork;
        public uint DwFlags;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
        public string SzDevice;
    }

    [DllImport("kernel32.dll", EntryPoint = "GetModuleHandleW", SetLastError = true, CharSet = CharSet.Unicode)]
    internal static extern IntPtr GetModuleHandle(string? lpModuleName);

    [DllImport("user32.dll", EntryPoint = "RegisterClassExW", SetLastError = true, CharSet = CharSet.Unicode)]
    internal static extern ushort RegisterClassEx(ref WndClassEx lpwcx);

    [DllImport("user32.dll", EntryPoint = "CreateWindowExW", SetLastError = true, CharSet = CharSet.Unicode)]
    internal static extern IntPtr CreateWindowEx(
        long dwExStyle,
        string lpClassName,
        string lpWindowName,
        long dwStyle,
        int x,
        int y,
        int nWidth,
        int nHeight,
        IntPtr hWndParent,
        IntPtr hMenu,
        IntPtr hInstance,
        IntPtr lpParam);

    [DllImport("user32.dll", EntryPoint = "DefWindowProcW", SetLastError = true)]
    internal static extern IntPtr DefWindowProc(IntPtr hWnd, uint msg, UIntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool DestroyWindow(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool PostMessage(IntPtr hWnd, uint msg, UIntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    internal static extern void PostQuitMessage(int nExitCode);

    [DllImport("user32.dll", EntryPoint = "GetMessageW", SetLastError = true)]
    internal static extern int GetMessage(out Msg lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool TranslateMessage(ref Msg lpMsg);

    [DllImport("user32.dll", EntryPoint = "DispatchMessageW")]
    internal static extern IntPtr DispatchMessage(ref Msg lpMsg);

    [DllImport("user32.dll", EntryPoint = "FindWindowW", SetLastError = true, CharSet = CharSet.Unicode)]
    internal static extern IntPtr FindWindow(string? lpClassName, string? lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [DllImport("user32.dll", EntryPoint = "FindWindowExW", SetLastError = true, CharSet = CharSet.Unicode)]
    internal static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string? lpszClass, string? lpszWindow);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", EntryPoint = "GetClassNameW", SetLastError = true, CharSet = CharSet.Unicode)]
    internal static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll", EntryPoint = "GetWindowTextW", SetLastError = true, CharSet = CharSet.Unicode)]
    internal static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool GetWindowRect(IntPtr hWnd, out Rect lpRect);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool GetClientRect(IntPtr hWnd, out Rect lpRect);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool ScreenToClient(IntPtr hWnd, ref Point lpPoint);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern IntPtr SendMessageTimeoutW(
        IntPtr hWnd,
        uint msg,
        UIntPtr wParam,
        IntPtr lParam,
        uint fuFlags,
        uint uTimeout,
        out UIntPtr lpdwResult);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern IntPtr GetParent(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW", SetLastError = true)]
    internal static extern IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW", SetLastError = true)]
    internal static extern IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool SetWindowPos(
        IntPtr hWnd,
        IntPtr hWndInsertAfter,
        int x,
        int y,
        int cx,
        int cy,
        uint uFlags);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    internal static extern int GetSystemMetrics(int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);

    [DllImport("user32.dll", EntryPoint = "GetMonitorInfoW", SetLastError = true, CharSet = CharSet.Unicode)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool GetMonitorInfo(IntPtr hMonitor, ref MonitorInfoEx lpmi);

    internal static string HwndToString(IntPtr hwnd)
    {
        return hwnd == IntPtr.Zero ? string.Empty : hwnd.ToInt64().ToString();
    }

    internal static string? HwndToNullableString(IntPtr hwnd)
    {
        return hwnd == IntPtr.Zero ? null : hwnd.ToInt64().ToString();
    }

    internal static string IntPtrToHex(IntPtr value)
    {
        return $"0x{value.ToInt64():X}";
    }

    internal static IntPtr ParseHwnd(string? hwndText)
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

    internal static int GetLastError()
    {
        return Marshal.GetLastWin32Error();
    }

    internal static string GetClassNameSafe(IntPtr hwnd)
    {
        var builder = new StringBuilder(256);
        return GetClassName(hwnd, builder, builder.Capacity) > 0 ? builder.ToString() : string.Empty;
    }

    internal static string GetWindowTextSafe(IntPtr hwnd)
    {
        var builder = new StringBuilder(256);
        return GetWindowText(hwnd, builder, builder.Capacity) > 0 ? builder.ToString() : string.Empty;
    }

    internal static WindowRectInfo? GetRectSafe(IntPtr hwnd)
    {
        if (!GetWindowRect(hwnd, out var rect))
        {
            return null;
        }

        return new WindowRectInfo
        {
            Left = rect.Left,
            Top = rect.Top,
            Right = rect.Right,
            Bottom = rect.Bottom,
            Width = rect.Right - rect.Left,
            Height = rect.Bottom - rect.Top,
        };
    }

    internal static WindowRectInfo? GetClientRectSafe(IntPtr hwnd)
    {
        if (!GetClientRect(hwnd, out var rect))
        {
            return null;
        }

        return RectToInfo(rect);
    }

    internal static WindowRectInfo? ScreenRectToClientRect(IntPtr parentHwnd, WindowRectInfo? screenRect)
    {
        if (screenRect is null)
        {
            return null;
        }

        var topLeft = new Point
        {
            X = screenRect.Left,
            Y = screenRect.Top,
        };
        var bottomRight = new Point
        {
            X = screenRect.Right,
            Y = screenRect.Bottom,
        };

        if (!ScreenToClient(parentHwnd, ref topLeft) || !ScreenToClient(parentHwnd, ref bottomRight))
        {
            return null;
        }

        return new WindowRectInfo
        {
            Left = topLeft.X,
            Top = topLeft.Y,
            Right = bottomRight.X,
            Bottom = bottomRight.Y,
            Width = bottomRight.X - topLeft.X,
            Height = bottomRight.Y - topLeft.Y,
        };
    }

    internal static List<IntPtr> EnumerateChildWindows(IntPtr parentHwnd)
    {
        var children = new List<IntPtr>();
        var child = IntPtr.Zero;
        while ((child = FindWindowEx(parentHwnd, child, null, null)) != IntPtr.Zero)
        {
            children.Add(child);
        }

        return children;
    }

    internal static MonitorInfo? GetNearestMonitorInfoSafe(IntPtr hwnd)
    {
        var monitor = MonitorFromWindow(hwnd, MonitorDefaultToNearest);
        if (monitor == IntPtr.Zero)
        {
            return null;
        }

        var info = new MonitorInfoEx
        {
            CbSize = Marshal.SizeOf<MonitorInfoEx>(),
            SzDevice = string.Empty,
        };

        if (!GetMonitorInfo(monitor, ref info))
        {
            return null;
        }

        return new MonitorInfo
        {
            Hwnd = HwndToString(monitor),
            IsPrimary = (info.DwFlags & 1) == 1,
            MonitorRect = RectToInfo(info.RcMonitor),
            WorkRect = RectToInfo(info.RcWork),
        };
    }

    internal static WindowRectInfo GetVirtualScreenRect()
    {
        var left = GetSystemMetrics(SmXVirtualScreen);
        var top = GetSystemMetrics(SmYVirtualScreen);
        var width = Math.Max(1, GetSystemMetrics(SmCxVirtualScreen));
        var height = Math.Max(1, GetSystemMetrics(SmCyVirtualScreen));
        return new WindowRectInfo
        {
            Left = left,
            Top = top,
            Right = left + width,
            Bottom = top + height,
            Width = width,
            Height = height,
        };
    }

    internal static WindowRectInfo GetPrimaryScreenRect()
    {
        var width = Math.Max(1, GetSystemMetrics(SmCxScreen));
        var height = Math.Max(1, GetSystemMetrics(SmCyScreen));
        return new WindowRectInfo
        {
            Left = 0,
            Top = 0,
            Right = width,
            Bottom = height,
            Width = width,
            Height = height,
        };
    }

    internal static bool RectMismatch(WindowRectInfo? expected, WindowRectInfo? actual)
    {
        if (expected is null || actual is null)
        {
            return true;
        }

        return expected.Width != actual.Width || expected.Height != actual.Height;
    }

    internal static bool RectMatches(WindowRectInfo? rect, WindowRectInfo? target)
    {
        if (rect is null || target is null)
        {
            return false;
        }

        return rect.Left == target.Left &&
            rect.Top == target.Top &&
            rect.Width == target.Width &&
            rect.Height == target.Height;
    }

    internal static bool RectCovers(WindowRectInfo? rect, WindowRectInfo? target)
    {
        if (rect is null || target is null)
        {
            return false;
        }

        return rect.Width >= target.Width && rect.Height >= target.Height;
    }

    internal static bool HasDescendantWindow(IntPtr hwnd, string className)
    {
        return FindDescendantWindow(hwnd, className) != IntPtr.Zero;
    }

    internal static IntPtr FindDescendantWindow(IntPtr hwnd, string className)
    {
        return FindDescendantWindow(hwnd, className, 0);
    }

    private static IntPtr FindDescendantWindow(IntPtr hwnd, string className, int depth)
    {
        if (hwnd == IntPtr.Zero || depth > 8)
        {
            return IntPtr.Zero;
        }

        var child = IntPtr.Zero;
        while ((child = FindWindowEx(hwnd, child, null, null)) != IntPtr.Zero)
        {
            if (string.Equals(GetClassNameSafe(child), className, StringComparison.Ordinal))
            {
                return child;
            }

            var descendant = FindDescendantWindow(child, className, depth + 1);
            if (descendant != IntPtr.Zero)
            {
                return descendant;
            }
        }

        return IntPtr.Zero;
    }

    private static WindowRectInfo RectToInfo(Rect rect)
    {
        return new WindowRectInfo
        {
            Left = rect.Left,
            Top = rect.Top,
            Right = rect.Right,
            Bottom = rect.Bottom,
            Width = rect.Right - rect.Left,
            Height = rect.Bottom - rect.Top,
        };
    }
}
