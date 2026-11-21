//go:build windows

package platform

import (
	"os"
	"strings"

	"github.com/mitchellh/go-ps"
)

// memtrim_windows.go — сброс рабочих наборов, когда окно спрятано в трей.
//
// UI живёт в дочерних процессах msedgewebview2.exe (browser/GPU/renderer),
// и пока окно скрыто, их страницы простаивают. EmptyWorkingSet вытесняет
// нетронутые страницы в pagefile: в диспетчере задач приложение в трее
// худеет до десятков мегабайт, а при показе окна нужные страницы лениво
// подгружаются обратно.
//
// ВАЖНО: трогаем ТОЛЬКО своё дерево процессов. Фильтр — подъём по цепочке
// родителей до нашего PID: чужие Wails/Tauri-приложения имеют своё дерево
// и сюда не попадают ни при каких условиях.

// TrimMemory вытесняет простаивающие страницы собственного процесса и
// потомков WebView2. Безопасно вызывать в любой момент: вытесняются только
// нетронутые страницы, активный код не страдает.
func TrimMemory() {
	self := os.Getpid()
	trimWorkingSet(self)

	processes, err := ps.Processes()
	if err != nil {
		return
	}
	parents := make(map[int]int, len(processes))
	for _, p := range processes {
		parents[p.Pid()] = p.PPid()
	}
	for _, p := range processes {
		if !strings.EqualFold(p.Executable(), "msedgewebview2.exe") {
			continue
		}
		if !isDescendant(p.Pid(), self, parents) {
			// Чужой WebView2 (другое Wails/Tauri-приложение) — не наше,
			// не трогаем.
			continue
		}
		trimWorkingSet(p.Pid())
	}
}

// isDescendant поднимается по цепочке родителей: renderer-ы WebView2 —
// внуки нашего процесса, поэтому прямого сравнения PPid мало.
func isDescendant(pid, ancestor int, parents map[int]int) bool {
	for current := pid; current > 0; {
		parent, ok := parents[current]
		if !ok || parent == current {
			return false
		}
		if parent == ancestor {
			return true
		}
		current = parent
	}
	return false
}

func trimWorkingSet(pid int) {
	process, err := openProcessForTrim(pid)
	if err != nil {
		return
	}
	defer closeHandle(process)
	emptyWorkingSet(process)
}
