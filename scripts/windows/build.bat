@echo off
REM EnableDelayedExpansion is required: %ERRORLEVEL% inside a parenthesized
REM block is expanded when the whole block is PARSED, i.e. before gsudo has
REM even run, so it always read as empty and the failure branch below fired
REM on every build, printing "exit code " with no number.
setlocal EnableExtensions EnableDelayedExpansion

REM Script lives in scripts\windows\ - project root is two levels up.
set "ROOT=%~dp0..\.."
set "SELF=%~f0"
pushd "%ROOT%" >nul

REM Auto-update needs nothing from the build: the feed URL and its public key
REM live in code (internal/application/update/ota). Publishing is a separate
REM step - see docs/ota.md (go run ./cmd/beam-ota publish ...).

set "SELF_ELEVATED="
if /I "%~1"=="--elevated" (
    set "SELF_ELEVATED=1"
    shift
)

set "PROD="
set "FORWARD_ARGS="
REM Closed-beta tag shown next to the version ("2.0.1 FD1"): pass it as
REM `--beta FD1` or set BEAM_BETA_TAG. No tag means a stable build.
if not defined BEAM_BETA_TAG set "BEAM_BETA_TAG="
:collect_args
if "%~1"=="" goto args_ready
if /I "%~1"=="prod" (
    set "PROD=1"
    shift
    goto collect_args
)
if /I "%~1"=="--beta" (
    set "BEAM_BETA_TAG=%~2"
    shift
    shift
    goto collect_args
)
set "FORWARD_ARGS=%FORWARD_ARGS% %~1"
shift
goto collect_args

:args_ready

if not defined SELF_ELEVATED (
    call :require_tool gsudo
    REM The elevated copy runs in a fresh process: hand the beta tag over as an argument.
    set "BETA_ARGS="
    if defined BEAM_BETA_TAG set "BETA_ARGS=--beta !BEAM_BETA_TAG!"
    if defined PROD (
        gsudo --chdir "%ROOT%" "%SELF%" --elevated prod !BETA_ARGS! %FORWARD_ARGS%
    ) else (
        gsudo --chdir "%ROOT%" "%SELF%" --elevated !BETA_ARGS! %FORWARD_ARGS%
    )
    set "EXITCODE=!ERRORLEVEL!"
    if not "!EXITCODE!"=="0" (
        echo.
        echo ERROR: elevated build failed with exit code !EXITCODE! ^(see output above^).
        echo If nothing was printed above at all, gsudo likely failed to elevate/relaunch
        echo this script itself - try running the same command directly:
        echo   gsudo --chdir "%ROOT%" "%SELF%" --elevated %FORWARD_ARGS%
        echo to see gsudo's own error, or check "gsudo status".
        echo If it says the operation was canceled by the user, you simply
        echo dismissed the UAC prompt - accept it and run the command again.
    )
    popd >nul
    exit /b !EXITCODE!
)

set "PATH=%PATH%;%USERPROFILE%\go\bin;%USERPROFILE%\.bun\bin"

call :require_tool wails || goto :fail
call :require_tool bun || goto :fail
call :require_tool go || goto :fail

REM NSIS is only needed for `prod` (the -nsis flag). Checked BEFORE the build
REM on purpose: when makensis is missing, wails prints a mere WARNING and still
REM exits 0, so the installer silently does not appear and the script used to
REM claim success anyway. Better to lose 1 second than 1 minute.
if defined PROD call :ensure_makensis
if errorlevel 1 goto :fail

call :read_version || goto :fail
call :make_hash || goto :fail

set "WAILS_LDFLAGS=-X main.version=%VERSION% -X main.variant=release -X main.buildHash=%BUILDHASH%"
if defined BEAM_BETA_TAG (
    set "WAILS_LDFLAGS=!WAILS_LDFLAGS! -X main.betaTag=%BEAM_BETA_TAG%"
    echo Beta tag: %BEAM_BETA_TAG%
)

if defined PROD (
    echo Cleaning build\bin...
    if exist "build\bin" rmdir /s /q "build\bin"
    if exist "build\bin" echo WARNING: could not fully clean build\bin - a Beam process is probably still running. Close it if the build behaves oddly.

    echo Building BeamRelay...
    go build -trimpath -ldflags "-H=windowsgui -X main.variant=release" -o "build\bin\BeamRelay.exe" ".\cmd\beam-relay"
    if errorlevel 1 goto :fail

    REM Must happen BEFORE the NSIS pass: project.nsi packs build\bin\wintun.dll.
    call :copy_wintun || goto :fail

    echo Building Beam + NSIS installer with admin rights...
    echo Version: %VERSION%
    echo Build hash: %BUILDHASH%

    wails build -trimpath -ldflags "%WAILS_LDFLAGS%" -nsis%FORWARD_ARGS%
    if errorlevel 1 goto :fail

    echo.
    call :report_installer
    if errorlevel 1 goto :fail
    echo.
    echo Releases are normally built and shipped by CI: push tag v%VERSION% ^(see docs/ota.md^).
    echo To ship this local build by hand instead:
    echo   go run ./cmd/beam-ota publish -target windows-amd64 -live -file Beam.exe=build/bin/Beam.exe -file BeamRelay.exe=build/bin/BeamRelay.exe -notes release-notes/%VERSION%.ru.txt
    popd >nul
    exit /b 0
)

echo Building Beam with admin rights...
echo Version: %VERSION%
echo Build hash: %BUILDHASH%

wails build -trimpath -ldflags "%WAILS_LDFLAGS%"%FORWARD_ARGS%
if errorlevel 1 (
    set "EXITCODE=!ERRORLEVEL!"
    popd >nul
    exit /b !EXITCODE!
)

echo Building BeamRelay...
go build -trimpath -ldflags "-H=windowsgui -X main.variant=release" -o "build\bin\BeamRelay.exe" ".\cmd\beam-relay"
if errorlevel 1 goto :fail

call :copy_wintun
set "EXITCODE=%ERRORLEVEL%"
popd >nul
exit /b %EXITCODE%

REM The TUN layer opens the adapter through golang.zx2c4.com/wireguard/tun,
REM which loads wintun.dll with LOAD_LIBRARY_SEARCH_APPLICATION_DIR only - so
REM the driver has to sit next to the exe. Without this step connecting fails
REM with "Error loading wintun.dll DLL".
:copy_wintun
set "WINTUN_ARCH=amd64"
if /I "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "WINTUN_ARCH=arm64"
if not exist "build\windows\wintun\%WINTUN_ARCH%\wintun.dll" (
    echo ERROR: build\windows\wintun\%WINTUN_ARCH%\wintun.dll is missing - the build would produce an app that cannot start the TUN interface.
    exit /b 1
)
if not exist "build\bin" mkdir "build\bin"
REM A running Beam keeps the DLL loaded and the copy fails with "access
REM denied"; an existing copy is still fine to ship.
copy /y "build\windows\wintun\%WINTUN_ARCH%\wintun.dll" "build\bin\wintun.dll" >nul 2>nul
if not errorlevel 1 exit /b 0
if exist "build\bin\wintun.dll" (
    echo WARNING: could not overwrite build\bin\wintun.dll ^(a Beam process is probably still running^) - packaging the existing copy.
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

:ensure_makensis
REM winget/choco do not always put NSIS on PATH, so probe the default install
REM locations too and extend PATH for the child wails process.
where.exe makensis >nul 2>nul
if not errorlevel 1 exit /b 0
if exist "%ProgramFiles(x86)%\NSIS\makensis.exe" set "PATH=%PATH%;%ProgramFiles(x86)%\NSIS"
if exist "%ProgramFiles%\NSIS\makensis.exe" set "PATH=%PATH%;%ProgramFiles%\NSIS"
where.exe makensis >nul 2>nul
if not errorlevel 1 exit /b 0
echo ERROR: makensis not found - NSIS is required to build the installer.
echo Install it with:  winget install NSIS.NSIS
echo Then open a NEW terminal so the updated PATH is picked up.
exit /b 1

REM wails exits 0 even when it failed to create the installer, so never trust
REM its exit code alone - verify the artifact actually exists on disk.
:report_installer
set "INSTALLER="
for %%f in ("build\bin\*installer*.exe") do set "INSTALLER=%%~nxf"
if not defined INSTALLER (
    echo ERROR: the build finished but NO installer was produced in build\bin.
    echo Most likely makensis disappeared from PATH mid-build.
    exit /b 1
)
echo Installer ready: build\bin\%INSTALLER%
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
