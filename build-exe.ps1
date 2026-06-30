# Find the built-in C# compiler (csc.exe) in Windows .NET Framework directory
$cscPath = Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4.0.*" -Filter "csc.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
if (-not $cscPath) {
    $cscPath = Get-ChildItem "C:\Windows\Microsoft.NET\Framework\v4.0.*" -Filter "csc.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
}

if (-not $cscPath) {
    Write-Error "C# compiler (csc.exe) not found. Please ensure .NET Framework 4.0 or newer is installed."
    exit 1
}

Write-Host "Found C# compiler: $cscPath"
Write-Host "Compiling ServizLauncher.cs..."

# Compile:
# /target:winexe - Compiles as a GUI application (no command console popup when run)
# /reference:... - Links required assembly dependencies
# /out:serviz-remonti.exe - Set the output filename
& $cscPath /target:winexe /reference:System.Windows.Forms.dll,System.Drawing.dll,System.dll,System.Core.dll /out:serviz-remonti.exe ServizLauncher.cs

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation successful! Created: serviz-remonti.exe"
} else {
    Write-Error "Compilation failed."
    exit 1
}
