@echo off
echo ==========================================
echo   Delete all "nul" files
echo ==========================================
echo.
echo Searching in: %~dp0
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$count = 0;" ^
    "Get-ChildItem -Path '%~dp0' -Recurse -Force -ErrorAction SilentlyContinue |" ^
    "Where-Object { $_.Name -eq 'nul' -and -not $_.PSIsContainer } |" ^
    "ForEach-Object {" ^
    "    Write-Host '[DELETING]' $_.FullName;" ^
    "    try { [System.IO.File]::Delete('\\?\' + $_.FullName); $count++ }" ^
    "    catch { Write-Host '[ERROR] Failed:' $_ -ForegroundColor Red }" ^
    "};" ^
    "Write-Host '';" ^
    "Write-Host '==========================================';" ^
    "Write-Host '  Deleted' $count 'file(s).';" ^
    "Write-Host '=========================================='"

echo.
pause
