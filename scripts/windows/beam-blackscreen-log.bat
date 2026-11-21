@echo off
setlocal EnableExtensions
title BEAM black screen log
cd /d "%~dp0"
set "BEAMBS_SELF=%~f0"

rem BEAM requires admin rights, and the debug flags only reach WebView2 when
rem BEAM is started from an elevated process, so elevate this script first.
net session >nul 2>&1
if %errorlevel%==0 goto :run
echo Requesting administrator rights (UAC)...
powershell -NoProfile -Command "try { Start-Process -FilePath $env:BEAMBS_SELF -Verb RunAs -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel%==0 exit /b
echo Administrator rights are required. Run this file as administrator.
pause
exit /b 1

:run
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s = Get-Content -LiteralPath $env:BEAMBS_SELF -Raw -Encoding UTF8; $m = '#' + '#PS_BEGIN##'; Invoke-Expression ($s.Substring($s.IndexOf($m) + $m.Length))"
echo.
pause
exit /b

##PS_BEGIN##
# Запускает BEAM с отладочным портом WebView2, перезагружает страницу и
# записывает всё, что упало в JS при старте, состояние DOM, скриншот
# страницы, версии WebView2/Windows/GPU и хвост crash.log.
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$Port = 9229
$Desktop = [Environment]::GetFolderPath('Desktop')
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$OutFile = Join-Path $Desktop "beam-blackscreen-$Stamp.txt"
$ShotFile = Join-Path $Desktop "beam-blackscreen-$Stamp.png"
$Log = New-Object System.Text.StringBuilder

function W([string]$text) { [void]$Log.AppendLine($text); Write-Host $text }
function Section([string]$name) { W ''; W ('==== ' + $name + ' ====') }

Write-Host ''
Write-Host '  BEAM - лог чёрного экрана' -ForegroundColor Cyan
Write-Host '  BEAM будет закрыт и запущен заново в режиме отладки.' -ForegroundColor Yellow
Write-Host ''

# ---------------------------------------------------------------- система
Section 'Система'
try {
    $os = Get-CimInstance Win32_OperatingSystem
    W ('Windows: ' + $os.Caption + ' ' + $os.Version + ' (' + $os.OSArchitecture + ')')
} catch { W ('Windows: ? ' + $_.Exception.Message) }
W ('Сессия: ' + $env:SESSIONNAME)
try {
    Get-CimInstance Win32_VideoController | ForEach-Object {
        W ('GPU: ' + $_.Name + ' | драйвер ' + $_.DriverVersion + ' | ' + $_.CurrentHorizontalResolution + 'x' + $_.CurrentVerticalResolution)
    }
} catch {}

$wvVersions = @()
foreach ($k in 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
               'HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
               'HKCU:\Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') {
    try { $v = (Get-ItemProperty -LiteralPath $k -ErrorAction Stop).pv; if ($v) { $wvVersions += "$v ($k)" } } catch {}
}
if ($wvVersions.Count) { $wvVersions | ForEach-Object { W ('WebView2 Runtime: ' + $_) } }
else { W 'WebView2 Runtime: НЕ НАЙДЕН в реестре' }
foreach ($n in 'WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS', 'WEBVIEW2_BROWSER_EXECUTABLE_FOLDER', 'WEBVIEW2_USER_DATA_FOLDER', 'BEAM_DISABLE_GPU') {
    foreach ($scope in 'Machine', 'User') {
        $v = [Environment]::GetEnvironmentVariable($n, $scope)
        if ($v) { W ("env $n [$scope] = $v") }
    }
}

# ---------------------------------------------------------------- BEAM
Section 'BEAM'
$exe = $null
$running = Get-Process -Name 'Beam' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($running) { try { $exe = $running.Path } catch {} }
if (-not $exe) {
    $candidates = @()
    foreach ($pf in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'Programs'))) {
        if ($pf) { $candidates += (Join-Path $pf 'Blerk\Beam\Beam.exe'), (Join-Path $pf 'Beam\Beam.exe') }
    }
    foreach ($k in 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*') {
        Get-ItemProperty $k -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match '(?i)^beam\b' } | ForEach-Object {
            if ($_.InstallLocation) { $candidates += (Join-Path $_.InstallLocation 'Beam.exe') }
            if ($_.DisplayIcon) { $candidates += (($_.DisplayIcon -replace ',\d+$', '') -replace '"', '') }
        }
    }
    $exe = $candidates | Where-Object { $_ -and $_ -match '(?i)beam\.exe$' -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
}
if (-not $exe) {
    W 'Beam.exe не найден. Запустите BEAM один раз и повторите.'
    [IO.File]::WriteAllText($OutFile, $Log.ToString(), (New-Object Text.UTF8Encoding $true))
    return
}
$info = (Get-Item -LiteralPath $exe).VersionInfo
W ('Путь: ' + $exe)
W ('Версия: ' + $info.ProductVersion + ' / файл ' + $info.FileVersion)

$appData = Join-Path $env:APPDATA 'Beam'
W ('GPU отключён маркером: ' + (Test-Path -LiteralPath (Join-Path $appData 'webview-gpu.off')))
$wvData = Join-Path $env:APPDATA 'Beam.exe'
if (Test-Path -LiteralPath $wvData) {
    $dumps = @(Get-ChildItem -LiteralPath $wvData -Recurse -Filter *.dmp -ErrorAction SilentlyContinue)
    W ('Профиль WebView2: ' + $wvData + ' | crash-дампов: ' + $dumps.Count)
} else { W ('Профиль WebView2: нет (' + $wvData + ') - первый запуск') }

# ---------------------------------------------------------------- запуск с отладкой
Section 'Запуск с отладкой WebView2'
Get-Process -Name 'Beam' -ErrorAction SilentlyContinue | ForEach-Object { W ('Закрываю BEAM pid ' + $_.Id); try { $_.Kill() } catch {} }
Start-Sleep -Seconds 2

$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=$Port --remote-allow-origins=*"
$proc = Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe) -PassThru
Remove-Item Env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
W ('BEAM запущен, pid ' + $proc.Id)

$target = $null
$deadline = (Get-Date).AddSeconds(40)
while (-not $target -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 700
    if ($proc.HasExited) { break }
    try {
        $list = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json" -TimeoutSec 2
        $target = $list | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    } catch {}
}
if ($proc.HasExited) { W ('BEAM завершился сам, код ' + $proc.ExitCode) }

if (-not $target) {
    W 'Отладочный порт WebView2 не ответил: WebView2 не запустился (или BEAM ушёл в трей без окна).'
    $wvProcs = @(Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'Beam' })
    W ('Процессов msedgewebview2 у BEAM: ' + $wvProcs.Count)
    $browser = $wvProcs | Where-Object { $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
    if ($browser) { W ('Флаги WebView2: ' + (($browser.CommandLine -split ' --' | Select-Object -Skip 1 | Where-Object { $_ -notmatch '^(user-data-dir|mojo|field-trial|metrics|variations)' }) -join ' --')) }
} else {
    W ('Страница: ' + $target.url)

    # ------------------------------------------------------------ CDP
    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $ws.Options.KeepAliveInterval = [TimeSpan]::FromSeconds(20)
    try { $ws.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait(10000) | Out-Null } catch {}
    if ($ws.State -ne 'Open') { W ('Не удалось подключиться к WebView2 по отладочному протоколу: ' + $ws.State) }
    $script:nextId = 0
    $script:pending = $null
    $script:buffer = New-Object byte[] 1048576
    $script:stream = New-Object IO.MemoryStream

    function Send-Cdp([string]$method, $params) {
        $script:nextId++
        $msg = @{ id = $script:nextId; method = $method; params = $(if ($params) { $params } else { @{} }) } | ConvertTo-Json -Depth 10 -Compress
        $bytes = [Text.Encoding]::UTF8.GetBytes($msg)
        if ($ws.State -ne 'Open') { return -1 }
        $ws.SendAsync((New-Object ArraySegment[byte] -ArgumentList @(, $bytes)), 'Text', $true, [Threading.CancellationToken]::None).Wait()
        return $script:nextId
    }

    # Следующее сообщение или $null, если за $ms ничего не пришло.
    function Receive-Cdp([int]$ms) {
        $until = (Get-Date).AddMilliseconds($ms)
        while ($true) {
            if ($ws.State -ne 'Open') { return $null }
            if (-not $script:pending) {
                $seg = New-Object ArraySegment[byte] -ArgumentList @(, $script:buffer)
                $script:pending = $ws.ReceiveAsync($seg, [Threading.CancellationToken]::None)
            }
            $left = [int]($until - (Get-Date)).TotalMilliseconds
            try {
                if ($left -le 0 -or -not $script:pending.Wait($left)) { return $null }
                $r = $script:pending.Result
            } catch { $script:pending = $null; return $null }
            $script:pending = $null
            $script:stream.Write($script:buffer, 0, $r.Count)
            if ($r.EndOfMessage) {
                $text = [Text.Encoding]::UTF8.GetString($script:stream.ToArray())
                $script:stream.SetLength(0)
                return ($text | ConvertFrom-Json)
            }
        }
    }

    $events = New-Object System.Collections.ArrayList
    function Call-Cdp([string]$method, $params, [int]$ms = 10000) {
        $id = Send-Cdp $method $params
        $until = (Get-Date).AddMilliseconds($ms)
        while ((Get-Date) -lt $until) {
            $m = Receive-Cdp ([int]($until - (Get-Date)).TotalMilliseconds)
            if (-not $m) { break }
            if ($id -lt 0) { break }
            if ($m.id -eq $id) { return $m }
            if ($m.method) { [void]$events.Add($m) }
        }
        return $null
    }

    [void](Call-Cdp 'Runtime.enable' $null)
    [void](Call-Cdp 'Log.enable' $null)
    [void](Call-Cdp 'Page.enable' $null)
    $events.Clear()
    W 'Перезагружаю страницу и собираю ошибки 12 секунд...'
    [void](Send-Cdp 'Page.reload' @{ ignoreCache = $true })
    $until = (Get-Date).AddSeconds(12)
    while ((Get-Date) -lt $until) {
        $m = Receive-Cdp 500
        if ($m -and $m.method) { [void]$events.Add($m) }
        if ($ws.State -ne 'Open') { break }
    }

    Section 'Ошибки и консоль JS'
    $n = 0
    foreach ($e in $events) {
        switch ($e.method) {
            'Runtime.exceptionThrown' {
                $d = $e.params.exceptionDetails
                $desc = if ($d.exception.description) { $d.exception.description } else { $d.text }
                W ('[EXCEPTION] ' + $desc); $n++
                if ($d.url) { W ('    at ' + $d.url + ':' + $d.lineNumber + ':' + $d.columnNumber) }
            }
            'Runtime.consoleAPICalled' {
                $parts = ($e.params.args | ForEach-Object { if ($null -ne $_.value) { [string]$_.value } elseif ($_.description) { $_.description } else { $_.type } }) -join ' '
                W ('[console.' + $e.params.type + '] ' + $parts); $n++
            }
            'Log.entryAdded' {
                $en = $e.params.entry
                W ('[' + $en.source + '/' + $en.level + '] ' + $en.text + $(if ($en.url) { ' (' + $en.url + ')' } else { '' })); $n++
            }
        }
    }
    if (-not $n) { W 'Ни одной ошибки или записи в консоли.' }

    Section 'Состояние страницы'
    $expr = @'
(() => {
  const root = document.getElementById('root');
  const ls = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = (localStorage.getItem(k) || '').length; } } catch (e) { ls.error = String(e); }
  let theme = null; try { theme = localStorage.getItem('theme'); } catch (e) {}
  return JSON.stringify({
    href: location.href,
    readyState: document.readyState,
    rootChildren: root ? root.childElementCount : -1,
    bodyChildren: document.body ? document.body.childElementCount : -1,
    bodyText: document.body ? document.body.innerText.slice(0, 400) : null,
    htmlClass: document.documentElement.className,
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    bodyBg: document.body ? getComputedStyle(document.body).backgroundColor : null,
    wailsGo: typeof window.go,
    wailsRuntime: typeof window.runtime,
    theme: theme,
    localStorageKeys: ls,
    userAgent: navigator.userAgent,
    size: innerWidth + 'x' + innerHeight + ' @' + devicePixelRatio
  }, null, 2);
})()
'@
    $res = Call-Cdp 'Runtime.evaluate' @{ expression = $expr; returnByValue = $true }
    if ($res -and $res.result.result.value) { $res.result.result.value -split "`n" | ForEach-Object { W $_ } }
    else { W 'Не удалось прочитать состояние страницы.' }

    $shot = Call-Cdp 'Page.captureScreenshot' @{ format = 'png' } 20000
    if ($shot -and $shot.result.data) {
        [IO.File]::WriteAllBytes($ShotFile, [Convert]::FromBase64String($shot.result.data))
        W ('Скриншот страницы (то, что нарисовал WebView2): ' + $ShotFile)
    }
    try { $ws.Dispose() } catch {}
}

# ---------------------------------------------------------------- логи BEAM
foreach ($f in 'crash.log', 'fatal.log') {
    $p = Join-Path $appData "logs\$f"
    Section $f
    if (Test-Path -LiteralPath $p) { Get-Content -LiteralPath $p -Tail 150 -Encoding UTF8 | ForEach-Object { W $_ } }
    else { W 'нет файла' }
}

Section 'Окно'
$visible = Read-Host 'Окно BEAM сейчас показывает интерфейс? (y/n)'
W ('Пользователь видит интерфейс: ' + $visible)

# Отладочный экземпляр закрываем, чтобы порт не оставался открытым.
Get-Process -Name 'Beam' -ErrorAction SilentlyContinue | ForEach-Object { try { $_.Kill() } catch {} }

[IO.File]::WriteAllText($OutFile, $Log.ToString(), (New-Object Text.UTF8Encoding $true))
Write-Host ''
Write-Host ('  Готово. Лог: ' + $OutFile) -ForegroundColor Green
Write-Host '  BEAM закрыт - запустите его обычным способом.'
try { Start-Process explorer.exe -ArgumentList ('/select,"' + $OutFile + '"') } catch {}
