@echo off
setlocal EnableExtensions

REM Script lives in scripts\windows\ - project root is two levels up.
set "ROOT=%~dp0..\.."
pushd "%ROOT%" >nul

set "SELF_ELEVATED="
if /I "%~1"=="--elevated" (
    set "SELF_ELEVATED=1"
    shift
)

set "FORWARD_ARGS="
:collect_args
if "%~1"=="" goto args_ready
set "FORWARD_ARGS=%FORWARD_ARGS% %~1"
shift
goto collect_args

:args_ready

if not defined SELF_ELEVATED (
    call :require_tool gsudo
    gsudo --chdir "%ROOT%" "%~f0" --elevated %FORWARD_ARGS%
    set "EXITCODE=%ERRORLEVEL%"
    if not "%EXITCODE%"=="0" (
        echo.
        echo ERROR: elevated wails dev failed with exit code %EXITCODE% ^(see output above^).
        echo If nothing was printed above at all, gsudo likely failed to elevate/relaunch
        echo this script itself - try running the same command directly:
        echo   gsudo --chdir "%ROOT%" "%~f0" --elevated %FORWARD_ARGS%
        echo to see gsudo's own error, or check "gsudo status".
    )
    popd >nul
    exit /b %EXITCODE%
)

set "PATH=%PATH%;%USERPROFILE%\go\bin;%USERPROFILE%\.bun\bin"

call :require_tool wails || goto :fail
call :require_tool bun || goto :fail

call :read_version || goto :fail
call :make_hash || goto :fail

set "WAILS_LDFLAGS=-X main.version=%VERSION% -X main.variant=dev -X main.buildHash=%BUILDHASH%"

REM wails dev runs the exe straight out of build\bin, and wireguard/tun only
REM looks for wintun.dll next to the exe - without it Connect fails with
REM "Error loading wintun.dll DLL".
call :copy_wintun || goto :fail

echo Starting Wails dev with admin rights...
echo Version: %VERSION%
echo Build hash: %BUILDHASH%

wails dev -ldflags "%WAILS_LDFLAGS%"%FORWARD_ARGS%
set "EXITCODE=%ERRORLEVEL%"
popd >nul
exit /b %EXITCODE%

:copy_wintun
set "WINTUN_ARCH=amd64"
if /I "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "WINTUN_ARCH=arm64"
if not exist "build\windows\wintun\%WINTUN_ARCH%\wintun.dll" (
    echo ERROR: build\windows\wintun\%WINTUN_ARCH%\wintun.dll is missing - TUN mode will not start.
    exit /b 1
)
if not exist "build\bin" mkdir "build\bin"
REM A previously started Beam keeps wintun.dll loaded, so the copy fails with
REM "access denied" - which is harmless as long as the DLL is already there.
REM Overwriting it only matters when the driver itself changes.
copy /y "build\windows\wintun\%WINTUN_ARCH%\wintun.dll" "build\bin\wintun.dll" >nul 2>nul
if not errorlevel 1 exit /b 0
if exist "build\bin\wintun.dll" (
    echo NOTE: could not overwrite build\bin\wintun.dll ^(a Beam process is probably still running^) - using the existing copy.
    exit /b 0
)
echo ERROR: failed to copy wintun.dll into build\bin.
exit /b 1

:read_version
set "VERSION="
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "$cfg = Get-Content 'wails.json' -Raw | ConvertFrom-Json; [string]$cfg.Info.productVersion"`) do set "VERSION=%%i"
if not defined VERSION set "VERSION=dev"
exit /b 0

:make_hash
set "BUILDHASH="
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "-join ((1..8) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })"`) do set "BUILDHASH=%%i"
if not defined BUILDHASH set "BUILDHASH=unknown"
exit /b 0

:require_tool
where.exe %~1 >nul 2>nul
if errorlevel 1 (
    echo ERROR: Required tool not found in PATH: %~1
    exit /b 1
)
exit /b 0

:fail
set "EXITCODE=%ERRORLEVEL%"
popd >nul
exit /b %EXITCODE%
