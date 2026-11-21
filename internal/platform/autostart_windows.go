//go:build windows

package platform

import (
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"strings"
	"sync"
	"syscall"
	"unicode/utf16"
)

const autoStartFlag = "--autostart"

const legacyAutoStartTaskName = "BeamAutoStart"

var legacyAutoStartCleanupOnce sync.Once

func cleanupLegacyAutoStartTask() {
	legacyAutoStartCleanupOnce.Do(func() {
		_ = noWindowCmd("schtasks", "/Delete", "/TN", legacyAutoStartTaskName, "/F").Run()
	})
}

func autoStartTaskName() string {
	return "BeamVPN" + variantSuffix()
}

const taskXML = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>BEAM VPN autostart</Description>
    <Author>BEAM</Author>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>%[1]s</UserId>
      <Delay>PT0S</Delay>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>%[1]s</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>false</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>4</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>%[2]s</Command>
      <Arguments>%[3]s</Arguments>
    </Exec>
  </Actions>
</Task>`

func IsAutoStartLaunch(args []string) bool {
	for _, arg := range args {
		if strings.EqualFold(strings.TrimSpace(arg), autoStartFlag) {
			return true
		}
	}
	return false
}

func IsLaunchOnStartupEnabled(appName string) (bool, error) {
	cleanupLegacyAutoStartTask()
	err := noWindowCmd("schtasks", "/Query", "/TN", autoStartTaskName()).Run()
	return err == nil, nil
}

func SetLaunchOnStartup(appName string, enabled bool) error {
	cleanupLegacyAutoStartTask()
	if enabled {
		return createTask()
	}
	return removeTask()
}

func createTask() error {
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to resolve exe path: %w", err)
	}

	u, err := user.Current()
	if err != nil {
		return fmt.Errorf("failed to resolve the current user: %w", err)
	}

	content := fmt.Sprintf(taskXML,
		xmlEscape(u.Username),
		xmlEscape(exePath),
		autoStartFlag,
	)

	xmlPath, err := writeTempXML(content)
	if err != nil {
		return err
	}
	defer os.Remove(xmlPath)

	out, err := noWindowCmd("schtasks", "/Create", "/XML", xmlPath, "/TN", autoStartTaskName(), "/F").CombinedOutput()
	if err != nil {
		return fmt.Errorf("schtasks /Create: %s: %w", strings.TrimSpace(string(out)), err)
	}
	return nil
}

func removeTask() error {
	enabled, _ := IsLaunchOnStartupEnabled("")
	if !enabled {
		return nil
	}
	out, err := noWindowCmd("schtasks", "/Delete", "/TN", autoStartTaskName(), "/F").CombinedOutput()
	if err != nil {
		return fmt.Errorf("schtasks /Delete: %s: %w", strings.TrimSpace(string(out)), err)
	}
	return nil
}

func writeTempXML(content string) (string, error) {
	f, err := os.CreateTemp("", "beam-task-*.xml")
	if err != nil {
		return "", err
	}
	defer f.Close()
	if _, err := f.Write(toUTF16LE(content)); err != nil {
		os.Remove(f.Name())
		return "", err
	}
	return f.Name(), nil
}

func noWindowCmd(name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: 0x08000000,
		HideWindow:    true,
	}
	return cmd
}

func xmlEscape(s string) string {
	return strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
		"'", "&apos;",
	).Replace(s)
}

func toUTF16LE(s string) []byte {
	encoded := utf16.Encode([]rune(s))
	buf := make([]byte, 0, len(encoded)*2+2)
	buf = append(buf, 0xFF, 0xFE)
	for _, r := range encoded {
		buf = append(buf, byte(r), byte(r>>8))
	}
	return buf
}
