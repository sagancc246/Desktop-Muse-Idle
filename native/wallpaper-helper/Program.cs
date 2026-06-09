using System.Text;
using System.Text.Json;
using WallpaperHelper;

const string HelperVersion = "0.1.4";
var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
};

Console.OutputEncoding = Encoding.UTF8;

try
{
    var command = args.Length > 0 ? args[0].Trim().ToLowerInvariant() : "status";
    var exitCode = command switch
    {
        "version" => WriteJson(new Dictionary<string, object?>
        {
            ["ok"] = true,
            ["command"] = "version",
            ["helperVersion"] = HelperVersion,
            ["supported"] = true,
        }),
        "status" => WriteJson(new Dictionary<string, object?>
        {
            ["ok"] = true,
            ["command"] = "status",
            ["helperVersion"] = HelperVersion,
            ["supported"] = OperatingSystem.IsWindows(),
        }),
        "find-desktop" => WriteJson(DesktopWindowFinder.FindDesktop(HelperVersion, "find-desktop")),
        "attach" => HandleAttach(args),
        "detach" => HandleDetach(args),
        _ => WriteJson(new Dictionary<string, object?>
        {
            ["ok"] = false,
            ["command"] = command,
            ["reason"] = "unknown_command",
            ["helperVersion"] = HelperVersion,
        }),
    };

    return exitCode;
}
catch (Exception error)
{
    return WriteJson(new Dictionary<string, object?>
    {
        ["ok"] = false,
        ["command"] = args.Length > 0 ? args[0] : "unknown",
        ["reason"] = "unhandled_exception",
        ["message"] = error.Message,
        ["helperVersion"] = HelperVersion,
    });
}

int HandleAttach(string[] args)
{
    var hwnd = GetOptionValue(args, "--hwnd");
    if (string.IsNullOrWhiteSpace(hwnd))
    {
        return WriteJson(new Dictionary<string, object?>
        {
            ["ok"] = false,
            ["command"] = "attach",
            ["attached"] = false,
            ["reason"] = "missing_hwnd",
            ["helperVersion"] = HelperVersion,
        });
    }

    if (HasFlag(args, "--dry-run"))
    {
        var discovery = DesktopWindowFinder.FindDesktop(HelperVersion, "attach");
        discovery.Hwnd = hwnd;
        discovery.DryRun = true;
        discovery.Attached = false;
        discovery.Reason = "dry_run_no_set_parent";
        discovery.Ok = discovery.Errors.Count == 0;
        return WriteJson(discovery);
    }

    return WriteJson(WallpaperAttacher.Attach(HelperVersion, hwnd));
}

int HandleDetach(string[] args)
{
    var hwnd = GetOptionValue(args, "--hwnd");
    var previousParent = GetOptionValue(args, "--previous-parent");
    var previousStyle = GetOptionValue(args, "--previous-style");
    var previousExStyle = GetOptionValue(args, "--previous-ex-style");
    return WriteJson(WallpaperAttacher.Detach(
        HelperVersion,
        hwnd,
        previousParent,
        previousStyle,
        previousExStyle));
}

bool HasFlag(string[] args, string flagName)
{
    return args.Any((arg) => string.Equals(arg, flagName, StringComparison.OrdinalIgnoreCase));
}

string? GetOptionValue(string[] args, string optionName)
{
    for (var index = 0; index < args.Length - 1; index += 1)
    {
        if (string.Equals(args[index], optionName, StringComparison.OrdinalIgnoreCase))
        {
            return args[index + 1];
        }
    }

    return null;
}

int WriteJson(object payload)
{
    Console.WriteLine(JsonSerializer.Serialize(payload, jsonOptions));
    return 0;
}
