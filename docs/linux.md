# Beam на Linux

## Зависимости

Сборка (Wails требует GTK3 и WebKitGTK) и работа (setcap — для выдачи
`cap_net_admin`/`cap_net_raw` без root, polkit — для GUI-диалога, xdg-utils — для
`beam://`):

| Дистрибутив | Команда |
|---|---|
| Debian/Ubuntu | `sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libcap2-bin polkit xdg-utils` |
| Fedora | `sudo dnf install gtk3-devel webkit2gtk4.1-devel libcap polkit xdg-utils` |
| Arch | `sudo pacman -S gtk3 webkit2gtk-4.1 libcap polkit xdg-utils` |

`scripts/linux/build.sh` сам проверяет это перед сборкой и собирает под
архитектуру текущей машины (`BEAM_ARCH=amd64 ./build.sh` — чтобы переопределить).

## Чем Linux отличается от остальных платформ

* **Права.** Весь GUI под root не уходит: при первом запуске бинарник через
  pkexec выдаёт сам себе file capabilities и перезапускается. Capabilities
  привязаны к файлу, поэтому после каждой пересборки диалог появится снова —
  это ожидаемо (`internal/platform/privilege_linux.go`).
* **Окно.** Безрамочный режим включён только на Windows. На Linux рамку,
  драг и ресайз рисует WM — слишком разное поведение у GNOME, KDE и тайлингов.
* **Трей.** Через StatusNotifierItem. В GNOME нужно расширение AppIndicator, иначе
  иконки не будет; свёрнутое окно в этом случае возвращается повторным запуском.
* **Обновления.** Автообновление реализовано только на Windows и macOS; на Linux
  бинарник меняется вручную, в UI кнопки установки скрыты.
* **Пакетирование.** AppImage/.deb пока нет — на выходе бинарник в `build/bin`.
  Учтите, что в AppImage схема с capabilities не заработает: образ монтируется
  с nosuid.
