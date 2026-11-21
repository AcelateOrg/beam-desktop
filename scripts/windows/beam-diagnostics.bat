@echo off
setlocal EnableExtensions
title BEAM diagnostics
cd /d "%~dp0"
set "BEAMDIAG_SELF=%~f0"
set "BEAMDIAG_OUT=%~dp0"

rem --- elevation: needed for event logs, GPU/driver info and the live test ---
net session >nul 2>&1
if %errorlevel%==0 goto :run
if /i "%~1"=="noadmin" goto :run
echo Requesting administrator rights (UAC)...
powershell -NoProfile -Command "try { Start-Process -FilePath $env:BEAMDIAG_SELF -Verb RunAs -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel%==0 exit /b
echo Administrator rights were declined - running limited checks.

:run
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText($env:BEAMDIAG_SELF,[Text.Encoding]::UTF8); $i=$t.LastIndexOf('#'+'#PS-BEGIN'); Invoke-Expression $t.Substring($i)"
echo.
pause
exit /b

##PS-BEGIN
# ============================================================================
#  BEAM diagnostics - collects system / WebView2 / GPU / BEAM state into
#  debug.log. No server addresses, keys, subscription links, IPs, MACs,
#  user names or machine names are written: everything goes through Scrub.
# ============================================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$DiagVersion = '1.0'
$Started     = Get-Date

$script:sb       = New-Object System.Text.StringBuilder
$script:Findings = New-Object System.Collections.ArrayList
function W([string]$t) { [void]$script:sb.AppendLine($t) }
function KV([string]$k, $v) { W ("{0,-36}: {1}" -f $k, $v) }
function Finding([string]$level, [string]$text) { [void]$script:Findings.Add(("[{0}] {1}" -f $level, $text)) }
function Section([string]$name, [scriptblock]$body) {
    W ''; W ('=' * 78); W ('== ' + $name); W ('=' * 78)
    Write-Host ('  ... ' + $name)
    $sw = [Diagnostics.Stopwatch]::StartNew()
    try { & $body } catch { W ('!! section failed: ' + $_.Exception.Message) }
    W ('(took {0} ms)' -f [int]$sw.ElapsedMilliseconds)
}

# ---------------------------------------------------------------- scrubbing
$script:Repl = @()
if ($env:USERPROFILE) { $script:Repl += ,@([regex]::Escape($env:USERPROFILE), '%USERPROFILE%') }
if ($env:USERNAME -and $env:USERNAME.Length -ge 3) { $script:Repl += ,@(('\b' + [regex]::Escape($env:USERNAME) + '\b'), '<user>') }
if ($env:COMPUTERNAME -and $env:COMPUTERNAME.Length -ge 3) { $script:Repl += ,@(('\b' + [regex]::Escape($env:COMPUTERNAME) + '\b'), '<pc>') }

$script:IpEval = [System.Text.RegularExpressions.MatchEvaluator] {
    param($m)
    $ip = $m.Value
    $o = $ip.Split('.') | ForEach-Object { [int]$_ }
    if ($o[0] -eq 127 -or $ip -eq '0.0.0.0' -or $o[0] -eq 255 -or $o[0] -ge 224) { return $ip }
    if ($o[0] -eq 172 -and $o[1] -eq 19 -and $o[2] -eq 0) { return $ip }          # BEAM tunnel 172.19.0.0/30
    if ($o[0] -eq 10 -or ($o[0] -eq 192 -and $o[1] -eq 168) -or ($o[0] -eq 172 -and $o[1] -ge 16 -and $o[1] -le 31) -or ($o[0] -eq 169 -and $o[1] -eq 254)) { return '<lan-ip>' }
    return '<ip>'
}

function Scrub([string]$s) {
    if ([string]::IsNullOrEmpty($s)) { return $s }
    foreach ($r in $script:Repl) { $s = [regex]::Replace($s, $r[0], $r[1], 'IgnoreCase') }
    $s = [regex]::Replace($s, '(?i)\b(vless|vmess|trojan|ssr?|hysteria2?|hy2|tuic|wireguard|wg|socks5?|https?|beam|sub)://[^\s"''<>]+', '<$1-link>')
    $s = [regex]::Replace($s, '(?i)\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '<uuid>')
    $s = [regex]::Replace($s, '(?i)\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b', '<email>')
    $s = [regex]::Replace($s, '(?i)\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b', '<mac>')
    $s = [regex]::Replace($s, '(?i)\b(?:[0-9a-f]{1,4}:){4,7}[0-9a-f]{1,4}\b', '<ipv6>')
    $s = [regex]::Replace($s, '(?i)(?<![\w:.])(?:[0-9a-f]{1,4}:)+:(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)?(?![\w:])', '<ipv6>')
    $s = [regex]::Replace($s, '(?i)(?<![\w:.])::(?:[0-9a-f]{1,4})(?::[0-9a-f]{1,4})*(?![\w:])', '<ipv6>')
    $s = [regex]::Replace($s, '(?i)\b(lookup|resolve|resolving|server|host|sni|address|domain|dial (?:tcp|udp)\d?)([\s:="''`]+)(?!(?:[a-z0-9-]+\.)*(?:acelate\.com|microsoft\.com|msftconnecttest\.com|windowsupdate\.com)\b)(?:[a-z0-9-]+\.)+[a-z]{2,}\b', '$1$2<domain>')
    $s = [regex]::Replace($s, '(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])', $script:IpEval)
    $s = [regex]::Replace($s, '(?i)\b(?:[a-z0-9-]+\.)+[a-z]{2,}:\d{2,5}\b', '<host:port>')
    $s = [regex]::Replace($s, '\b[A-Za-z0-9_\-+/]{40,}={0,2}', '<token>')
    return $s
}

# JSON keys whose string values are never written.
$script:SensKey = '(?i)(pass|secret|token|key|uuid|^id$|user|email|login|auth|cookie|session|subscri|^sub|url|link|address|server|host|sni|domain|^path$|psk|seed|short|public|private|cert|licen|device|hwid|finger|name$|remark|alias|label)'
function San($o, [string]$key = '') {
    if ($null -eq $o) { return $null }
    if ($o -is [string]) {
        if ($key -match $script:SensKey -and $o.Length -gt 0) { return '<redacted>' }
        return (Scrub $o)
    }
    if ($o -is [System.Management.Automation.PSCustomObject]) {
        $r = [ordered]@{}
        foreach ($p in $o.PSObject.Properties) { $r[$p.Name] = San $p.Value $p.Name }
        return [pscustomobject]$r
    }
    if ($o -is [System.Collections.IEnumerable]) {
        $list = New-Object System.Collections.ArrayList
        foreach ($i in $o) { [void]$list.Add((San $i $key)) }
        return ,$list.ToArray()
    }
    return $o
}

function RegVal([string]$path, [string]$name) {
    try { return (Get-ItemProperty -LiteralPath $path -Name $name -ErrorAction Stop).$name } catch { return $null }
}
function TailFile([string]$path, [int]$lines) {
    try {
        $content = Get-Content -LiteralPath $path -Tail $lines -ErrorAction Stop
        foreach ($l in $content) { W ('    ' + (Scrub $l)) }
    } catch { W ('    !! cannot read: ' + $_.Exception.Message) }
}
function Ver([string]$v) { try { return [version]($v -replace '[^\d\.].*$', '') } catch { return $null } }

# ------------------------------------------------------------ output target
$OutDir = $env:BEAMDIAG_OUT
if (-not $OutDir) { $OutDir = (Get-Location).Path }
try { $probe = Join-Path $OutDir '.beamdiag_probe'; Set-Content -LiteralPath $probe -Value 1 -ErrorAction Stop; Remove-Item -LiteralPath $probe -Force }
catch { $OutDir = [Environment]::GetFolderPath('Desktop') }
$OutFile = Join-Path $OutDir 'debug.log'
$TmpDir  = Join-Path $env:TEMP ('beamdiag_' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null

$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host ''
Write-Host '  BEAM - диагностика системы' -ForegroundColor Cyan
Write-Host '  Собираю данные. Личные данные (IP, адреса серверов, ключи, имя пользователя) в отчёт НЕ попадают.'
if (-not $IsAdmin) { Write-Host '  Запущено без прав администратора - часть проверок будет неполной.' -ForegroundColor Yellow }
Write-Host ''

# ============================================================== discovery
$BeamDirs = New-Object System.Collections.ArrayList
$roots = @($env:APPDATA, $env:LOCALAPPDATA, (Join-Path $env:LOCALAPPDATA 'Programs'), $env:ProgramData, $env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
foreach ($r in $roots) {
    Get-ChildItem -LiteralPath $r -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '(?i)^beam(?![a-z])' } | ForEach-Object { [void]$BeamDirs.Add($_.FullName) }
}

$Uninstall = @()
foreach ($k in 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*') {
    $Uninstall += Get-ItemProperty $k -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match '(?i)\bbeam\b' }
}

$ExeCandidates = New-Object System.Collections.ArrayList
foreach ($u in $Uninstall) {
    foreach ($p in @($u.InstallLocation, (($u.DisplayIcon -replace ',\d+$', '') -replace '"', ''))) {
        if ($p -and (Test-Path -LiteralPath $p)) {
            if ((Get-Item -LiteralPath $p).PSIsContainer) { Get-ChildItem -LiteralPath $p -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object { [void]$ExeCandidates.Add($_.FullName) } }
            else { [void]$ExeCandidates.Add($p) }
        }
    }
}
foreach ($d in $BeamDirs) { Get-ChildItem -LiteralPath $d -Filter *.exe -Recurse -Depth 1 -ErrorAction SilentlyContinue | ForEach-Object { [void]$ExeCandidates.Add($_.FullName) } }
Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '(?i)^beam(?![a-z])' } | ForEach-Object { try { if ($_.Path) { [void]$ExeCandidates.Add($_.Path) } } catch {} }
try {
    $shell = New-Object -ComObject WScript.Shell
    foreach ($sd in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('CommonDesktopDirectory'), [Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('CommonPrograms'))) {
        if (-not $sd) { continue }
        Get-ChildItem -LiteralPath $sd -Filter *.lnk -Recurse -Depth 2 -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '(?i)^beam(?![a-z])' } | ForEach-Object {
            $t = $shell.CreateShortcut($_.FullName).TargetPath
            if ($t -and (Test-Path -LiteralPath $t)) { [void]$ExeCandidates.Add($t) }
        }
    }
} catch {}
$ExeCandidates = @($ExeCandidates | Where-Object { $_ -match '(?i)\.exe$' } | Sort-Object -Unique)
foreach ($pf in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'Programs'))) {
    if (-not $pf) { continue }
    foreach ($c in @((Join-Path $pf 'Blerk\Beam\Beam.exe'), (Join-Path $pf 'Beam\Beam.exe'), (Join-Path $pf 'BEAM\Beam.exe'))) { if (Test-Path -LiteralPath $c) { $ExeCandidates += $c } }
}
$ExeCandidates = @($ExeCandidates | Sort-Object -Unique)
$RunningBeam = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '(?i)^beam(?![a-z])' } | ForEach-Object { try { $_.Path } catch {} } | Where-Object { $_ } | Select-Object -First 1
$MainExe = $RunningBeam
if (-not $MainExe) {
    $MainExe = $ExeCandidates | Where-Object { [IO.Path]::GetFileName($_) -match '(?i)^beam(?![a-z])' -and [IO.Path]::GetFileName($_) -notmatch '(?i)relay|ota|unins|update|setup|install|helper' } |
        Sort-Object @{ Expression = { Ver ((Get-Item -LiteralPath $_).VersionInfo.FileVersion) } ; Descending = $true }, @{ Expression = { $_ -notmatch '(?i)program files' } ; Descending = $false } | Select-Object -First 1
}
if ($MainExe) { $InstallDir = Split-Path -Parent $MainExe; if (-not ($BeamDirs -contains $InstallDir)) { [void]$BeamDirs.Add($InstallDir) } }

# ================================================================ sections
Section 'Meta' {
    KV 'Diagnostics version' $DiagVersion
    KV 'Started' ($Started.ToString('yyyy-MM-dd HH:mm:ss zzz'))
    KV 'Administrator' $IsAdmin
    KV 'PowerShell' $PSVersionTable.PSVersion
    KV 'Session' $env:SESSIONNAME
    if ($env:SESSIONNAME -like 'RDP*') { Finding 'WARN' 'Запуск в RDP-сессии: WebView2 в удалённом рабочем столе часто рисует чёрное окно.' }
    if ($env:USERNAME -eq 'WDAGUtilityAccount') { Finding 'INFO' 'Похоже на Windows Sandbox.' }
}

Section 'Operating system' {
    $cv = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
    $os = Get-CimInstance Win32_OperatingSystem
    KV 'Caption' $os.Caption
    KV 'Version / build' ('{0} / {1}.{2}' -f $os.Version, (RegVal $cv 'CurrentBuild'), (RegVal $cv 'UBR'))
    KV 'DisplayVersion' (RegVal $cv 'DisplayVersion')
    KV 'EditionID' (RegVal $cv 'EditionID')
    KV 'InstallationType' (RegVal $cv 'InstallationType')
    KV 'Architecture' $os.OSArchitecture
    KV 'Language / locale' ('{0} / {1}' -f (Get-UICulture).Name, (Get-Culture).Name)
    KV 'Install date' $os.InstallDate
    KV 'Last boot' $os.LastBootUpTime
    $cs = Get-CimInstance Win32_ComputerSystem
    KV 'Manufacturer / model' ('{0} / {1}' -f $cs.Manufacturer, $cs.Model)
    KV 'Hypervisor present' $cs.HypervisorPresent
    KV 'RAM total (GB)' ([math]::Round($cs.TotalPhysicalMemory / 1GB, 1))
    KV 'RAM free (GB)' ([math]::Round($os.FreePhysicalMemory / 1MB, 1))
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    KV 'CPU' ('{0} ({1}C/{2}T)' -f $cpu.Name.Trim(), $cpu.NumberOfCores, $cpu.NumberOfLogicalProcessors)
    $sysDrive = Get-CimInstance Win32_LogicalDisk -Filter ("DeviceID='{0}'" -f $env:SystemDrive)
    KV 'System drive free (GB)' ([math]::Round($sysDrive.FreeSpace / 1GB, 1))
    if ($sysDrive.FreeSpace -lt 2GB) { Finding 'WARN' 'На системном диске меньше 2 ГБ: WebView2 может не создать профиль.' }
    $ed = [string](RegVal $cv 'EditionID')
    if ($ed -match '(?i)LTSC|EnterpriseS|IoT|N$') { Finding 'INFO' ("Редакция Windows '{0}' (LTSC/IoT/N): Edge и WebView2 Runtime там могут отсутствовать или быть урезаны." -f $ed) }
}

Section 'WebView2 Runtime' {
    $guid = '{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'
    $found = @()
    foreach ($k in "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\$guid", "HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\$guid", "HKCU:\Software\Microsoft\EdgeUpdate\Clients\$guid") {
        $pv = RegVal $k 'pv'
        $scope = ($k -split '\\')[0]
        KV ("Registry ({0}{1})" -f $scope, $(if ($k -match 'WOW6432') { ' x86' } else { '' })) $(if ($pv) { 'v' + $pv } else { '-' })
        if ($pv -and $pv -ne '0.0.0.0') { $found += $pv }
    }
    $wvDirs = @((Join-Path ${env:ProgramFiles(x86)} 'Microsoft\EdgeWebView\Application'), (Join-Path $env:ProgramFiles 'Microsoft\EdgeWebView\Application'), (Join-Path $env:LOCALAPPDATA 'Microsoft\EdgeWebView\Application'))
    foreach ($d in $wvDirs) {
        if (Test-Path -LiteralPath $d) {
            Get-ChildItem -LiteralPath $d -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^\d+\.' } | ForEach-Object {
                $exe = Join-Path $_.FullName 'msedgewebview2.exe'
                KV ('Folder ' + $_.Name) $(if (Test-Path -LiteralPath $exe) { 'msedgewebview2.exe present, v' + (Get-Item -LiteralPath $exe).VersionInfo.FileVersion } else { 'msedgewebview2.exe MISSING' })
                if (-not (Test-Path -LiteralPath $exe)) { Finding 'CRIT' ('Папка WebView2 ' + $_.Name + ' без msedgewebview2.exe - битая установка Runtime.') }
                else { $found += $_.Name }
            }
        }
    }
    $edge = Get-Item -LiteralPath (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe') -ErrorAction SilentlyContinue
    KV 'Microsoft Edge' $(if ($edge) { 'v' + $edge.VersionInfo.FileVersion } else { 'not installed' })
    foreach ($n in 'WEBVIEW2_BROWSER_EXECUTABLE_FOLDER', 'WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS', 'WEBVIEW2_USER_DATA_FOLDER', 'WEBVIEW2_RELEASE_CHANNEL_PREFERENCE') {
        foreach ($scope in 'Process', 'User', 'Machine') {
            $v = [Environment]::GetEnvironmentVariable($n, $scope)
            if ($v) { KV ("env {0} [{1}]" -f $n, $scope) (Scrub $v); Finding 'WARN' ("Задана переменная {0} ({1}) - она меняет поведение WebView2." -f $n, $scope) }
        }
    }
    foreach ($pk in 'HKLM:\SOFTWARE\Policies\Microsoft\Edge\WebView2', 'HKCU:\Software\Policies\Microsoft\Edge\WebView2', 'HKLM:\SOFTWARE\Policies\Microsoft\Edge', 'HKCU:\Software\Policies\Microsoft\Edge') {
        if (Test-Path $pk) {
            W ("Policies in " + $pk + ':')
            Get-ChildItem $pk -ErrorAction SilentlyContinue | ForEach-Object { $sub = $_; $sub.Property | ForEach-Object { W ('    {0}\{1} = {2}' -f $sub.PSChildName, $_, (Scrub ([string]$sub.GetValue($_)))) } }
            $item = Get-Item $pk; $item.Property | ForEach-Object { W ('    {0} = {1}' -f $_, (Scrub ([string]$item.GetValue($_)))) }
        }
    }
    $best = $found | ForEach-Object { Ver $_ } | Where-Object { $_ } | Sort-Object -Descending | Select-Object -First 1
    KV 'Detected runtime' $(if ($best) { 'v' + $best } else { 'NONE' })
    if (-not $best) { Finding 'CRIT' 'WebView2 Runtime не найден. Без него окно BEAM пустое/чёрное. Решение: поставить Evergreen WebView2 Runtime (go.microsoft.com/fwlink/p/?LinkId=2124703).' }
    elseif ($best.Major -lt 110) { Finding 'WARN' ("WebView2 Runtime устарел ({0}). Обновить Evergreen Runtime." -f $best) }
    $svc = Get-Service -Name edgeupdate, edgeupdatem, MicrosoftEdgeElevationService -ErrorAction SilentlyContinue
    foreach ($s in $svc) { KV ('Service ' + $s.Name) ('{0} / {1}' -f $s.Status, $s.StartType) }
}

Section 'GPU and display' {
    $gpus = Get-CimInstance Win32_VideoController
    $i = 0
    foreach ($g in $gpus) {
        W ("GPU #{0}" -f $i); $i++
        KV '  Name' $g.Name
        KV '  Vendor' $g.AdapterCompatibility
        KV '  Driver version / date' ('v{0} / {1}' -f $g.DriverVersion, $g.DriverDate)
        KV '  Status / error code' ('{0} / {1}' -f $g.Status, $g.ConfigManagerErrorCode)
        KV '  VRAM (MB, approx)' ([math]::Round($g.AdapterRAM / 1MB))
        KV '  Mode' $g.VideoModeDescription
        if ($g.Name -match '(?i)basic display|basic render|стандартный VGA|базовый') { Finding 'CRIT' ("Видеодрайвер не установлен ('{0}'). WebView2 без драйвера часто рисует чёрное окно - поставить драйвер GPU." -f $g.Name) }
        if ($g.ConfigManagerErrorCode -and $g.ConfigManagerErrorCode -ne 0) { Finding 'WARN' ("Видеоадаптер '{0}' с ошибкой устройства {1}." -f $g.Name, $g.ConfigManagerErrorCode) }
        try { if ($g.DriverDate -and $g.DriverDate -lt (Get-Date).AddYears(-3)) { Finding 'WARN' ("Драйвер '{0}' старше 3 лет ({1:yyyy-MM-dd})." -f $g.Name, $g.DriverDate) } } catch {}
    }
    if (@($gpus).Count -gt 1) { Finding 'INFO' 'Несколько GPU (гибридная графика) - частая причина чёрного окна WebView2; см. тест с --disable-gpu.' }
    KV 'HAGS (HwSchMode, 2=on)' (RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers' 'HwSchMode')
    KV 'TdrLevel' (RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers' 'TdrLevel')
    KV 'DWM OverlayTestMode (5=MPO off)' (RegVal 'HKLM:\SOFTWARE\Microsoft\Windows\Dwm' 'OverlayTestMode')
    KV 'DPI (LogPixels)' (RegVal 'HKCU:\Control Panel\Desktop' 'LogPixels')
    KV 'AppliedDPI' (RegVal 'HKCU:\Control Panel\Desktop\WindowMetrics' 'AppliedDPI')
    try {
        Add-Type -AssemblyName System.Windows.Forms
        foreach ($sc in [System.Windows.Forms.Screen]::AllScreens) { KV ('Screen ' + $(if ($sc.Primary) { '(primary)' } else { '' })) ('{0}x{1} @ {2},{3}, {4} bpp' -f $sc.Bounds.Width, $sc.Bounds.Height, $sc.Bounds.X, $sc.Bounds.Y, $sc.BitsPerPixel) }
    } catch {}
    $pref = 'HKCU:\Software\Microsoft\DirectX\UserGpuPreferences'
    if (Test-Path $pref) {
        $it = Get-Item $pref
        $it.Property | Where-Object { $_ -match '(?i)beam|webview' } | ForEach-Object { KV ('GPU preference ' + (Scrub $_)) $it.GetValue($_) }
    }
    $dx = Join-Path $TmpDir 'dxdiag.txt'
    Write-Host '      dxdiag (до 60 с)...'
    $p = Start-Process -FilePath "$env:SystemRoot\System32\dxdiag.exe" -ArgumentList "/t `"$dx`"" -PassThru -WindowStyle Hidden
    if (-not $p.WaitForExit(60000)) { try { $p.Kill() } catch {} ; W 'dxdiag: timed out' }
    if (Test-Path -LiteralPath $dx) {
        W 'dxdiag (display devices, filtered):'
        $keep = '^\s*(DirectX Version|Card name|Manufacturer|Chip type|DAC type|Device Type|Display Memory|Dedicated Memory|Shared Memory|Current Mode|HDR Support|Monitor Name|Native Mode|Output Type|Driver Name|Driver File Version|Driver Version|DDI Version|Feature Levels|Driver Model|Hybrid Graphics GPU|Power P-states|Graphics Preemption|Compute Preemption|Miracast|DXVA2 Modes|Driver Date/Size|WHQL Logo''d|Hardware Scheduling|Displayable|Advanced Color|MPO)'
        Get-Content -LiteralPath $dx -ErrorAction SilentlyContinue | Where-Object { $_ -match $keep -and $_ -notmatch 'DXVA2 Modes' } | ForEach-Object { W ('    ' + (Scrub $_.Trim())) }
    }
}

Section 'Security software' {
    try { Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction Stop | ForEach-Object { KV 'Antivirus' ('{0} (state 0x{1:X})' -f $_.displayName, $_.productState); if ($_.displayName -notmatch '(?i)defender') { Finding 'INFO' ("Сторонний антивирус: {0}. Может блокировать msedgewebview2.exe или wintun." -f $_.displayName) } } } catch { W 'SecurityCenter2 unavailable' }
    try {
        $mp = Get-MpComputerStatus -ErrorAction Stop
        KV 'Defender mode / realtime' ('{0} / {1}' -f $mp.AMRunningMode, $mp.RealTimeProtectionEnabled)
        $pref = Get-MpPreference -ErrorAction Stop
        KV 'Controlled folder access' $pref.EnableControlledFolderAccess
        if ($pref.EnableControlledFolderAccess -eq 1) { Finding 'WARN' 'Включён контролируемый доступ к папкам: может мешать BEAM/WebView2 писать данные.' }
    } catch { W 'Defender status unavailable' }
    KV 'Smart App Control (0 off,1 on,2 eval)' (RegVal 'HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy' 'VerifiedAndReputablePolicyState')
    $pat = '(?i)^(RTSS|MSIAfterburner|EncoderServer|overwolf|obs64|obs32|Nahimic.*|ArmouryCrate.*|LightingService|wallpaper32|wallpaper64|webwallpaper.*|Lively.*|TranslucentTB|StartAllBack.*|ExplorerPatcher.*|Fences|DisplayFusion.*|Rainmeter|ReShade.*|avp|avpui|ekrn|egui|AvastSvc|AvastUI|AVGSvc|AVGUI|bdagent|bdservicehost|mcshield|Norton.*|360Tray|360sd|HipsTray|HipsDaemon|zapret|winws|goodbyedpi|v2rayN|nekoray|nekobox|Hiddify.*|clash.*|mihomo|sing-box|xray|Outline.*|AmneziaVPN|wireguard|openvpn.*|ProtonVPN.*|happ|throne|Radmin.*|hamachi.*|ZeroTier.*|NordVPN.*|ExpressVPN.*|WindscribeService|Psiphon.*|Lantern|Discord|steamwebhelper|NVIDIA Share|nvcontainer|Teams|ms-teams)$'
    $hits = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -match $pat } | Select-Object -ExpandProperty Name -Unique
    KV 'Relevant running processes' $(if ($hits) { $hits -join ', ' } else { '-' })
    $vpnish = $hits | Where-Object { $_ -match '(?i)zapret|winws|goodbyedpi|v2ray|neko|hiddify|clash|mihomo|sing-box|xray|outline|amnezia|wireguard|openvpn|proton|happ|throne|nord|express|windscribe|psiphon|lantern' }
    if ($vpnish) { Finding 'WARN' ('Запущены другие VPN/обходы блокировок: ' + ($vpnish -join ', ') + ' - возможны конфликты маршрутов/драйверов.') }
}

Section 'Network (no addresses)' {
    Get-NetAdapter -IncludeHidden -ErrorAction SilentlyContinue | Where-Object { $_.Status -ne 'NotPresent' } | Sort-Object Status | ForEach-Object {
        KV ('Adapter ' + (Scrub $_.Name)) ('{0} | {1} | {2} | {3}' -f $_.Status, (Scrub $_.InterfaceDescription), $_.MediaType, $_.LinkSpeed)
    }
    $def = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue
    KV 'IPv4 default routes' ((@($def) | ForEach-Object { '{0} (metric {1})' -f (Scrub $_.InterfaceAlias), ($_.RouteMetric + $_.InterfaceMetric) }) -join '; ')
    if (-not $def) { Finding 'WARN' 'Нет маршрута IPv4 по умолчанию (нет интернета?).' }
    $is = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings'
    KV 'WinINET proxy enabled' (RegVal $is 'ProxyEnable')
    KV 'WinINET proxy server' (Scrub ([string](RegVal $is 'ProxyServer')))
    KV 'WinINET PAC' (Scrub ([string](RegVal $is 'AutoConfigURL')))
    $wh = (netsh winhttp show proxy) -join ' ' -replace '\s+', ' '
    KV 'WinHTTP proxy' (Scrub $wh)
    $wintun = Get-ChildItem "$env:SystemRoot\System32\drivers" -Filter 'wintun*.sys' -ErrorAction SilentlyContinue
    KV 'wintun driver' $(if ($wintun) { ($wintun | ForEach-Object { $_.Name + ' v' + $_.VersionInfo.FileVersion }) -join ', ' } else { '-' })
    foreach ($h in 'www.msftconnecttest.com') {
        try { $ok = Test-NetConnection -ComputerName $h -Port 80 -InformationLevel Quiet -WarningAction SilentlyContinue; KV ('TCP 80 to ' + $h) $ok } catch {}
    }
}

Section 'BEAM installation' {
    if (-not $Uninstall) { W 'No uninstall entry with "BEAM" found.' }
    foreach ($u in $Uninstall) {
        KV 'Uninstall entry' ('{0} | {1} | {2} | installed {3}' -f $u.DisplayName, $u.DisplayVersion, $u.Publisher, $u.InstallDate)
        KV '  InstallLocation' (Scrub ([string]$u.InstallLocation))
    }
    KV 'Executables found' ((@($ExeCandidates) | ForEach-Object { Scrub $_ }) -join '; ')
    if (-not $MainExe) { Finding 'CRIT' 'Не найден исполняемый файл BEAM.'; return }
    $fi = Get-Item -LiteralPath $MainExe
    KV 'Main exe' (Scrub $MainExe)
    KV 'File / product version' ('v{0} / v{1}' -f $fi.VersionInfo.FileVersion, $fi.VersionInfo.ProductVersion)
    KV 'Size / modified' ('{0:N0} bytes / {1:yyyy-MM-dd HH:mm}' -f $fi.Length, $fi.LastWriteTime)
    try { KV 'SHA256 (first 16)' ((Get-FileHash -LiteralPath $MainExe -Algorithm SHA256).Hash.Substring(0, 16)) } catch {}
    try { $sig = Get-AuthenticodeSignature -LiteralPath $MainExe; KV 'Signature' ('{0} / {1}' -f $sig.Status, $(if ($sig.SignerCertificate) { $sig.SignerCertificate.Subject -replace ',.*$', '' } else { '-' })) } catch {}
    $zone = Get-Content -LiteralPath $MainExe -Stream Zone.Identifier -ErrorAction SilentlyContinue
    KV 'Mark of the Web' $(if ($zone) { ($zone | Where-Object { $_ -match '^ZoneId' }) -join ' ' } else { 'no' })
    try { KV 'Path writable test' $(if ((Get-Acl -LiteralPath $InstallDir).Access | Where-Object { $_.IdentityReference -match 'Users|Пользователи' -and $_.FileSystemRights -match 'Write|Modify|FullControl' }) { 'users can write' } else { 'read-only for users' }) } catch {}
    W 'Files in install dir:'
    Get-ChildItem -LiteralPath $InstallDir -File -ErrorAction SilentlyContinue | ForEach-Object { W ('    {0,-40} {1,12:N0}  v{2}' -f $_.Name, $_.Length, $_.VersionInfo.FileVersion) }
    foreach ($rk in 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run') {
        $it = Get-Item $rk -ErrorAction SilentlyContinue
        if ($it) { $it.Property | Where-Object { $_ -match '(?i)beam' -or ([string]$it.GetValue($_)) -match '(?i)beam' } | ForEach-Object { KV ('Autostart ' + $rk.Substring(0, 4)) (Scrub ($_ + ' = ' + $it.GetValue($_))) } }
    }
    try { Get-ScheduledTask -ErrorAction Stop | Where-Object { $_.TaskName -match '(?i)beam' } | ForEach-Object { KV 'Scheduled task' ('{0} ({1})' -f $_.TaskName, $_.State) } } catch {}
    try { $mit = Get-ProcessMitigation -Name ([IO.Path]::GetFileName($MainExe)) -ErrorAction Stop; KV 'Exploit protection (DEP/ACG/CFG)' ('{0} / {1} / {2}' -f $mit.Dep.Enable, $mit.DynamicCode.BlockDynamicCode, $mit.Cfg.Enable) } catch {}
    $running = Get-Process -ErrorAction SilentlyContinue | Where-Object { try { $_.Path -eq $MainExe } catch { $false } }
    KV 'Running now' $(if ($running) { ($running | ForEach-Object { 'pid {0}, {1:N0} MB, started {2:HH:mm:ss}' -f $_.Id, ($_.WorkingSet64 / 1MB), $_.StartTime }) -join '; ' } else { 'no' })
}

# ---------------------------------------------------------------- live test
$script:TestResults = @()
Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue
try {
Add-Type -ErrorAction Stop @"
using System; using System.Collections.Generic; using System.Runtime.InteropServices; using System.Text;
public static class BeamDiagWin {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  public static List<IntPtr> Windows(uint pid, bool visibleOnly) {
    var list = new List<IntPtr>();
    EnumWindows(delegate (IntPtr h, IntPtr l) { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && (!visibleOnly || IsWindowVisible(h))) list.Add(h); return true; }, IntPtr.Zero);
    return list;
  }
  public static string ClassOf(IntPtr h) { var sb = new StringBuilder(256); GetClassName(h, sb, 256); return sb.ToString(); }
}
"@
} catch {}

function Get-Descendants([int]$rootPid) {
    $all = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
    $set = @{ $rootPid = $true }; $out = @(); $changed = $true
    while ($changed) {
        $changed = $false
        foreach ($p in $all) { if ($set.ContainsKey([int]$p.ParentProcessId) -and -not $set.ContainsKey([int]$p.ProcessId)) { $set[[int]$p.ProcessId] = $true; $out += $p; $changed = $true } }
    }
    return $out
}

function Analyze-Window([int]$procId) {
    $res = [ordered]@{ windows = 0; size = '-'; mean = -1; stddev = -1; colors = -1; verdict = 'no visible window' }
    try {
        $wins = [BeamDiagWin]::Windows([uint32]$procId, $true)
        $res.windows = $wins.Count
        $best = $null; $bestArea = 0
        foreach ($h in $wins) {
            $r = New-Object BeamDiagWin+RECT; [void][BeamDiagWin]::GetWindowRect($h, [ref]$r)
            $a = ($r.R - $r.L) * ($r.B - $r.T)
            if ($a -gt $bestArea) { $bestArea = $a; $best = $h; $rect = $r }
        }
        if (-not $best) { return $res }
        $w = $rect.R - $rect.L; $hgt = $rect.B - $rect.T
        $res.size = "${w}x${hgt} class=" + [BeamDiagWin]::ClassOf($best)
        if ($w -lt 50 -or $hgt -lt 50) { $res.verdict = 'window too small'; return $res }
        $bmp = New-Object System.Drawing.Bitmap $w, $hgt
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $hdc = $g.GetHdc(); $ok = [BeamDiagWin]::PrintWindow($best, $hdc, 2); $g.ReleaseHdc($hdc)
        if (-not $ok) { [void][BeamDiagWin]::SetForegroundWindow($best); Start-Sleep -Milliseconds 400; $g.CopyFromScreen($rect.L, $rect.T, 0, 0, $bmp.Size) }
        $g.Dispose()
        $n = 0; $sum = 0.0; $sum2 = 0.0; $colors = @{}
        $step = [math]::Max(4, [int]([math]::Sqrt($w * $hgt / 6000)))
        for ($y = [int]($hgt * 0.06); $y -lt $hgt; $y += $step) {
            for ($x = 0; $x -lt $w; $x += $step) {
                $c = $bmp.GetPixel($x, $y)
                $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
                $sum += $lum; $sum2 += $lum * $lum; $n++
                $colors[(($c.R -shr 4) -shl 8) -bor (($c.G -shr 4) -shl 4) -bor ($c.B -shr 4)] = 1
            }
        }
        $bmp.Dispose()
        $mean = $sum / $n; $sd = [math]::Sqrt([math]::Max(0, $sum2 / $n - $mean * $mean))
        $res.mean = [math]::Round($mean, 1); $res.stddev = [math]::Round($sd, 1); $res.colors = $colors.Count
        if ($sd -lt 2.5 -and $colors.Count -le 3) { $res.verdict = $(if ($mean -lt 40) { 'UNIFORM DARK (black screen)' } else { 'UNIFORM (blank)' }) }
        else { $res.verdict = 'has content' }
    } catch { $res.verdict = 'analysis failed: ' + $_.Exception.Message }
    return $res
}

function Stop-Beam {
    Get-Process -ErrorAction SilentlyContinue | Where-Object { try { ($_.Path -and $_.Path.StartsWith($InstallDir, [StringComparison]::OrdinalIgnoreCase)) -or $_.Name -match '(?i)^beam(?![a-z])' } catch { $false } } | ForEach-Object { try { $_.Kill() } catch {} }
    Start-Sleep -Seconds 2
}

function Run-Test([string]$label, [string]$wvArgs) {
    W ''; W ('--- Test ' + $label + ' ---')
    KV 'Extra WebView2 args' $wvArgs
    Stop-Beam
    $wvLog = Join-Path $TmpDir ('webview2_' + ($label -replace '\W', '') + '.log')
    $old = $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
    $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = ($wvArgs + " --enable-logging --v=0 --log-file=`"$wvLog`"").Trim()
    try { $p = Start-Process -FilePath $MainExe -WorkingDirectory $InstallDir -PassThru -ErrorAction Stop }
    catch { W ('!! start failed: ' + $_.Exception.Message); $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = $old; return $null }
    finally { }
    $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = $old
    Write-Host ''
    Write-Host ('  [Тест {0}] BEAM запущен. Подождите ~10 секунд.' -f $label) -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    Write-Host '  Если окно BEAM не появилось - откройте его из трея (значок у часов).'
    [void](Read-Host '  Когда окно на экране - нажмите Enter')
    Start-Sleep -Seconds 1
    $alive = -not $p.HasExited
    KV 'Process alive' $(if ($alive) { 'yes' } else { 'NO, exit code ' + $p.ExitCode })
    $target = $p.Id
    if (-not $alive) {
        $other = Get-Process -ErrorAction SilentlyContinue | Where-Object { try { $_.Path -eq $MainExe } catch { $false } } | Select-Object -First 1
        if ($other) { $target = $other.Id; KV 'Other BEAM instance' ('pid ' + $other.Id) }
    }
    $kids = Get-Descendants $target
    $wv = @($kids | Where-Object { $_.Name -eq 'msedgewebview2.exe' })
    $types = $wv | ForEach-Object { if ($_.CommandLine -match '--type=([\w-]+)') { $matches[1] } else { 'browser' } } | Group-Object | ForEach-Object { '{0}x{1}' -f $_.Name, $_.Count }
    KV 'Child processes' ((@($kids) | Group-Object Name | ForEach-Object { '{0}x{1}' -f $_.Name, $_.Count }) -join ', ')
    KV 'msedgewebview2 by type' $(if ($types) { $types -join ', ' } else { 'NONE' })
    $brw = $wv | Where-Object { $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
    if ($brw) {
        $exe = $brw.ExecutablePath
        KV 'WebView2 used' (Scrub $exe)
        if ($brw.CommandLine -match '--user-data-dir="?([^"]+?)"?(\s--|$)') { KV 'WebView2 user data dir' (Scrub $matches[1]) }
        $flags = [regex]::Matches($brw.CommandLine, '--(disable|enable|use|force)[\w-]*(=[^\s"]*)?') | ForEach-Object { $_.Value } | Select-Object -Unique
        KV 'WebView2 flags' (Scrub ($flags -join ' '))
    }
    $an = Analyze-Window $target
    foreach ($k in $an.Keys) { KV ('Window ' + $k) $an[$k] }
    $ans = Read-Host ('  [Тест {0}] Вы видите интерфейс BEAM (не чёрный/пустой экран)? Введите Y (да) или N (нет)' -f $label)
    $userOk = $ans -match '^(?i)(y|yes|д|да|l)'
    KV 'User says UI visible' $userOk
    if (Test-Path -LiteralPath $wvLog) { W 'WebView2 log (errors/warnings, last 120):'; Get-Content -LiteralPath $wvLog -ErrorAction SilentlyContinue | Where-Object { $_ -match ':(ERROR|WARNING|FATAL):' } | Select-Object -Last 120 | ForEach-Object { W ('    ' + (Scrub $_)) } }
    else { W 'WebView2 log: not created (WebView2 browser process did not start?)' }
    $r = [pscustomobject]@{ Label = $label; Alive = $alive; WebView = ($wv.Count -gt 0); GpuProc = [bool]($types -match 'gpu-process'); Auto = $an.verdict; User = $userOk }
    $script:TestResults += $r
    return $r
}

Section 'Live test (BEAM start)' {
    if (-not $MainExe) { W 'skipped: BEAM exe not found'; return }
    if ($env:BEAMDIAG_NOTEST) { W 'skipped: BEAMDIAG_NOTEST is set'; return }
    Write-Host ''
    Write-Host '  Сейчас будет живой тест: BEAM закроется и запустится 1-3 раза с разными настройками WebView2.' -ForegroundColor Yellow
    Write-Host '  Если BEAM подключён - соединение прервётся.' -ForegroundColor Yellow
    $go = Read-Host '  Запустить тест? Y - да, N - пропустить'
    if ($go -notmatch '^(?i)(y|yes|д|да|l)') { W 'skipped by user'; return }
    $a = Run-Test 'A-default' ''
    if ($a -and -not $a.User) {
        $b = Run-Test 'B-disable-gpu' '--disable-gpu --disable-gpu-compositing'
        if ($b -and $b.User) {
            Finding 'CRIT' 'С --disable-gpu окно работает: чёрный экран из-за GPU-ускорения WebView2 (драйвер/гибридная графика/MPO). Обходной путь - запуск WebView2 без GPU.'
        } elseif ($b) {
            $c = Run-Test 'C-no-codeintegrity' '--disable-gpu --disable-features=RendererCodeIntegrity --no-sandbox'
            if ($c -and $c.User) { Finding 'CRIT' 'Окно работает только без RendererCodeIntegrity/sandbox: WebView2 ломает антивирус/инжект в процессы (часто сторонний AV или оверлей).' }
            else { Finding 'CRIT' 'Окно чёрное при любых флагах WebView2: проблема в установке WebView2 Runtime или профиле WebView2 BEAM (см. разделы ниже).' }
        }
    } elseif ($a -and $a.User) {
        Finding 'INFO' 'Во время теста окно отрисовалось нормально - проблема плавающая (первый запуск/автозапуск/после сна?).'
    }
    foreach ($t in $script:TestResults) { if (-not $t.WebView) { Finding 'CRIT' ("Тест {0}: процесс msedgewebview2 не запустился - WebView2 не стартует вообще." -f $t.Label) } }
    Stop-Beam
    Write-Host '  Тест закончен, BEAM закрыт. Потом запустите его обычным способом.' -ForegroundColor Green
}

Section 'BEAM data folders' {
    if ($BeamDirs.Count -eq 0) { W 'none found'; Finding 'INFO' 'Папок данных BEAM не найдено (не запускался ни разу?).' }
    foreach ($d in $BeamDirs) {
        W ''; W ('[' + (Scrub $d) + ']')
        $files = Get-ChildItem -LiteralPath $d -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '(?i)\\EBWebView\\' }
        $total = (Get-ChildItem -LiteralPath $d -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        KV 'Total size (MB)' ([math]::Round($total / 1MB, 1))
        foreach ($f in ($files | Select-Object -First 250)) {
            $rel = $f.FullName.Substring($d.Length).TrimStart('\')
            W ('    {0,-70} {1,12:N0}  {2:yyyy-MM-dd HH:mm}' -f (Scrub $rel), $f.Length, $f.LastWriteTime)
        }
        if (@($files).Count -gt 250) { W ('    ... and {0} more files' -f (@($files).Count - 250)) }
        $ebw = Get-ChildItem -LiteralPath $d -Directory -Recurse -Depth 2 -Filter 'EBWebView' -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($ebw) {
            $dumps = Get-ChildItem -LiteralPath $ebw.FullName -Recurse -Include *.dmp -ErrorAction SilentlyContinue
            KV 'WebView2 profile' (Scrub $ebw.FullName)
            KV 'WebView2 profile size (MB)' ([math]::Round(((Get-ChildItem -LiteralPath $ebw.FullName -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum) / 1MB, 1))
            KV 'WebView2 crash dumps' @($dumps).Count
            if (@($dumps).Count -gt 0) { Finding 'WARN' ('В профиле WebView2 BEAM есть {0} crash-дампов - WebView2 падает.' -f @($dumps).Count); $dumps | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object { W ('    dump {0:yyyy-MM-dd HH:mm} {1:N0} bytes' -f $_.LastWriteTime, $_.Length) } }
            $ls = Join-Path $ebw.FullName 'Local State'
            if (Test-Path -LiteralPath $ls) { try { $j = Get-Content -LiteralPath $ls -Raw | ConvertFrom-Json; KV 'Local State: hw accel' $j.hardware_acceleration_mode.enabled; KV 'Local State: last version' $j.user_experience_metrics.stability.stats_version } catch {} }
        }
        foreach ($f in ($files | Where-Object { $_.Extension -match '(?i)^\.json$' -and $_.Name -match '(?i)^(config|settings|state|session|window|prefs|ui)' -and $_.Name -notmatch '(?i)profile|subscri|node|server|xray|cache' -and $_.FullName -notmatch '(?i)\\(core|profiles|temp|EBWebView|media)\\' -and $_.Length -lt 512KB })) {
            W ''; W ('  ' + (Scrub $f.Name) + ' (sanitized):')
            try { $j = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json; $jl = (((San $j) | ConvertTo-Json -Depth 20) -replace '\\u003c', '<' -replace '\\u003e', '>' -replace '\\u0027', "'") -split "`n"; $jl | Select-Object -First 400 | ForEach-Object { W ('    ' + $_.TrimEnd()) }; if ($jl.Count -gt 400) { W ('    ... ({0} more lines)' -f ($jl.Count - 400)) } }
            catch { W '    (not valid JSON)' }
        }
        $profiles = $files | Where-Object { $_.Name -match '(?i)profile|subscri|node|\.bpx$|\.beam$' -or $_.FullName -match '(?i)\\profiles\\' }
        if ($profiles) { KV 'Profile files (content NOT included)' (@($profiles).Count) }
        # Only the app's own crash/fatal logs: core/xray logs are traffic logs (visited domains), never included.
        foreach ($f in ($files | Where-Object { $_.Extension -match '(?i)^\.log$' -and $_.Name -match '(?i)^(crash|fatal)' } | Sort-Object LastWriteTime -Descending | Select-Object -First 4)) {
            W ''; W ('  ' + (Scrub $f.Name) + (' (last 300 lines, modified {0:yyyy-MM-dd HH:mm}):' -f $f.LastWriteTime))
            TailFile $f.FullName 300
        }
    }
}

Section 'Windows event logs (7 days)' {
    $since = (Get-Date).AddDays(-7)
    try {
        $ev = Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = $since; Level = 1, 2, 3 } -MaxEvents 3000 -ErrorAction Stop |
            Where-Object { $_.Message -match '(?i)beam|msedgewebview2|webview2|wintun' } | Select-Object -First 40
        KV 'Application: related events' @($ev).Count
        foreach ($e in $ev) {
            $msg = ($e.Message -replace '\s+', ' '); if ($msg.Length -gt 700) { $msg = $msg.Substring(0, 700) + '...' }
            W ('  {0:yyyy-MM-dd HH:mm:ss} [{1}] {2} #{3}: {4}' -f $e.TimeCreated, $e.LevelDisplayName, $e.ProviderName, $e.Id, (Scrub $msg))
        }
        if (@($ev | Where-Object { $_.ProviderName -eq 'Application Error' -and $_.Message -match '(?i)msedgewebview2' }).Count -gt 0) { Finding 'WARN' 'В журнале есть падения msedgewebview2.exe.' }
        if (@($ev | Where-Object { $_.ProviderName -eq 'Application Error' -and $_.Message -match '(?i)beam' }).Count -gt 0) { Finding 'WARN' 'В журнале есть падения процесса BEAM.' }
    } catch { W ('Application log: ' + $_.Exception.Message) }
    try {
        $tdr = Get-WinEvent -FilterHashtable @{ LogName = 'System'; StartTime = $since; ProviderName = 'Display' } -ErrorAction Stop
        KV 'GPU driver resets (Display 4101)' @($tdr | Where-Object { $_.Id -eq 4101 }).Count
        if (@($tdr | Where-Object { $_.Id -eq 4101 }).Count -gt 0) { Finding 'WARN' 'Видеодрайвер перезапускался (TDR) за последние 7 дней.' }
    } catch { KV 'GPU driver resets (Display 4101)' 0 }
    try {
        $gpuErr = Get-WinEvent -FilterHashtable @{ LogName = 'System'; StartTime = $since; Level = 1, 2 } -MaxEvents 2000 -ErrorAction Stop | Where-Object { $_.ProviderName -match '(?i)nvlddmkm|amdkmdag|amdwddmg|igfx|dxgkrnl|dxgkrnl|Display' } | Select-Object -First 10
        foreach ($e in $gpuErr) { $msg = ($e.Message -replace '\s+', ' '); if ($msg.Length -gt 300) { $msg = $msg.Substring(0, 300) + '...' }; W ('  {0:yyyy-MM-dd HH:mm} {1} #{2}: {3}' -f $e.TimeCreated, $e.ProviderName, $e.Id, (Scrub $msg)) }
    } catch {}
}

Section 'Windows Error Reporting' {
    $werRoots = @("$env:ProgramData\Microsoft\Windows\WER\ReportArchive", "$env:ProgramData\Microsoft\Windows\WER\ReportQueue", "$env:LOCALAPPDATA\Microsoft\Windows\WER\ReportArchive", "$env:LOCALAPPDATA\Microsoft\Windows\WER\ReportQueue")
    $n = 0
    foreach ($r in $werRoots) {
        Get-ChildItem -LiteralPath $r -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '(?i)beam|msedgewebview2' } | Sort-Object LastWriteTime -Descending | Select-Object -First 6 | ForEach-Object {
            $n++
            W ('  {0:yyyy-MM-dd HH:mm} {1}' -f $_.LastWriteTime, (Scrub $_.Name))
            $wer = Join-Path $_.FullName 'Report.wer'
            if (Test-Path -LiteralPath $wer) {
                Get-Content -LiteralPath $wer -Encoding Unicode -ErrorAction SilentlyContinue | Where-Object { $_ -match '^(EventType|FriendlyEventName|AppName|AppPath|Sig\[\d+\]\.(Name|Value)|DynamicSig\[\d+\]\.Value)=' } | ForEach-Object { W ('      ' + (Scrub $_)) }
            }
        }
    }
    KV 'Related WER reports' $n
}

# ================================================================== finish
$elapsed = [int]((Get-Date) - $Started).TotalSeconds
$head = New-Object System.Text.StringBuilder
[void]$head.AppendLine('BEAM debug.log  (diagnostics v' + $DiagVersion + ', ' + $Started.ToString('yyyy-MM-dd HH:mm') + ', ' + $elapsed + ' s)')
[void]$head.AppendLine('Sensitive data (IPs, server addresses, keys, links, user/PC names) is redacted.')
[void]$head.AppendLine('')
[void]$head.AppendLine('SUMMARY / FINDINGS')
[void]$head.AppendLine('------------------')
if ($script:Findings.Count -eq 0) { [void]$head.AppendLine('(no automatic findings)') }
foreach ($f in ($script:Findings | Sort-Object { switch -regex ($_) { '^\[CRIT' { 0 } '^\[WARN' { 1 } default { 2 } } })) { [void]$head.AppendLine($f) }
if ($script:TestResults.Count -gt 0) {
    [void]$head.AppendLine('')
    [void]$head.AppendLine('LIVE TEST')
    foreach ($t in $script:TestResults) { [void]$head.AppendLine(('  {0,-22} alive={1} webview={2} gpu-proc={3} auto="{4}" user-ok={5}' -f $t.Label, $t.Alive, $t.WebView, $t.GpuProc, $t.Auto, $t.User)) }
}
$text = $head.ToString() + $script:sb.ToString()
$text = Scrub $text
[IO.File]::WriteAllText($OutFile, $text, (New-Object System.Text.UTF8Encoding $true))
Remove-Item -LiteralPath $TmpDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '  Готово!' -ForegroundColor Green
Write-Host ('  Файл: ' + $OutFile)
Write-Host '  Отправьте этот файл debug.log разработчику.'
if (-not $env:BEAMDIAG_NOTEST) { try { Start-Process explorer.exe -ArgumentList ('/select,"' + $OutFile + '"') } catch {} }
