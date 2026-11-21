<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/public/beamfull.png">
    <source media="(prefers-color-scheme: light)" srcset="frontend/public/beamfull-dark.png">
    <img alt="Beam" src="frontend/public/beamfull-dark.png" width="360">
  </picture>
</p>

<p align="center">
  Кросс-платформенный многофункциональный прокси-клиент
</p>

<p align="center">
  <img alt="Go" src="https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white">
  <img alt="Wails" src="https://img.shields.io/badge/Wails-v2.13-DF0000?logo=wails&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="License" src="https://img.shields.io/badge/license-Beam%20Source%20License-orange">
  <img alt="Platforms" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey">
</p>

---

BEAM — десктопный VPN/прокси-клиент для Windows, macOS и Linux на собственном
форке Xray-core и собственном TUN-стеке.

## Возможности

- **VLESS / VMess / Trojan / Shadowsocks / Hysteria2** — все современные протоколы.
- **Split Tunneling** — простой список приложений и сайтов или режим ProTun
  с визуальным нод-редактором маршрутов.
- **Kill switch и защита от утечек DNS / IPv6.**
- **Формат `.beam`** — экспорт профилей с шифрованием, сроками действия и лимитами трафика.
- **Живая статистика и логи** — задержка узлов, счётчики трафика, логи ядра в реальном времени.
- **13 тем оформления**, системный трей, автозапуск, автообновление.

## Установка

Скачайте сборку под свою платформу со страницы [Releases](../../releases) или
с сайта [Acelate](https://acelate.com/beam). После установки Beam сам предлагает
обновления (на Windows и macOS).

## Как это устроено

Приложение — оболочка на [Wails](https://wails.io): Go-бэкенд и React-интерфейс
в системном WebView. Вся VPN-логика живёт в общем ядре
[`beam-bridge`](https://github.com/AcelateOrg/beam-bridge), которое делит его
с Android-клиентом:

```
beam-desktop (Wails + React)
   └── beam-bridge   профили, подписки, конфиг ядра, VPN
         ├── beam-core (xray-core-beam)   сетевое ядро, встроено в процесс
         └── beam-tun                     TUN, маршруты, kill switch
```

Оболочка передаёт ядру пути (`bootstrap.NewContainer`) и сведения о среде
(`internal/platform/bridge.go`, первой строкой `main()`), а ядро шлёт обратно
события через `SetEmitter`, куда подставляется `runtime.EventsEmit` из Wails.

## Структура

```
main.go                 точка входа: повышение прав, единственный инстанс, окно
app.go                  привязка хендлеров к Wails
cmd/beam-relay/         релей для протокол-хендлера и OTA-обновлений на Windows
cmd/beam-ota/           утилита для выпуска OTA-обновлений
internal/
  platform/             всё, что зависит от ОС (_windows / _darwin / _linux)
  bootstrap/            точка композиции: собирает ядро и сервисы
  application/          сервисы: профили, VPN, настройки, обновления
  presentation/wails/   хендлеры и DTO для фронтенда
  tray/                 иконка в системном трее
frontend/               React 19 + TypeScript, Vite, Tailwind CSS 4, Zustand, Radix UI
  wailsjs/              сгенерированные биндинги к Go, руками не править
ota-proxy/              Cloudflare Worker для раздачи обновлений (см. docs/ota.md)
scripts/                dev- и build-скрипты для Windows, macOS, Linux
release-notes/          тексты для окна обновления и GitHub-релиза
```

## Сборка

Нужны Go 1.26, [Wails CLI v2](https://wails.io/docs/gettingstarted/installation)
и [Bun](https://bun.sh). Рядом в одной папке должны лежать `beam-bridge`,
`xray-core-beam` и `beam-tun` (они подключены через `replace` в `go.mod`):

```
beam-development/
  beam-bridge/  beam-desktop/  beam-tun/  xray-core-beam/
```

Скрипты лежат в `scripts/windows`, `scripts/macos`, `scripts/linux`:

- `dev.bat` / `dev.sh` — запуск в режиме разработки (с правами администратора,
  иначе TUN не поднимется);
- `build.bat` / `build.sh` — релизная сборка в `build/bin`.

Linux: зависимости и отличия платформы описаны в [docs/linux.md](docs/linux.md).

## Участие

PR и issues приветствуются, подробности в [CONTRIBUTING.md](CONTRIBUTING.md).
Уязвимости: [SECURITY.md](SECURITY.md).

## Лицензия

[Beam Source License 1.0](LICENSE) ([перевод](LICENSE.ru.md)) — код можно читать,
собирать для себя и присылать PR ([CLA](CLA.md)); распространять сборки и
ребрендить нельзя. Бренд — [TRADEMARKS.md](TRADEMARKS.md). Xray-core и beam-tun — MPL-2.0.
