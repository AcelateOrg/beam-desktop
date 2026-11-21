# OTA-обновления Beam

Всё лежит в **GitHub Releases этого же (приватного) репозитория** `beam-desktop`:
бинарники, установщики и подписанный фид. Отдельного репо и хранилища нет.
Клиент ходит на `https://ota-updates.acelate.com` — это маленький
**ota-proxy** (Cloudflare Worker, `ota-proxy/`), который по read-only токену
читает релизы и отдаёт фид, а за бинарниками отправляет 302-редиректом прямо на
CDN GitHub (`release-assets.githubusercontent.com` — доступен из РФ). Через
прокси идут только пара КБ на проверку.

Прокси клиент **не доверяет**: pointer и манифест подписаны ed25519, файлы
сверяются по размеру и sha256. Когда репо станет публичным (2.1.0), ничего
переносить не нужно.

## Структура фида (schema v1)

| URL клиента | Ассет релиза `v{version}` |
|---|---|
| `/v1/channels/{channel}/{target}.json` + `.sig` | `ota-pointer-{channel}-{target}.json` + `.sig` — берётся из **самой высокой опубликованной** версии, где он есть |
| `/v1/releases/{target}/{version}.json` + `.sig` | `ota-release-{target}.json` + `.sig` |
| `/v1/assets/{tag}/{asset}` | любой ассет, например `windows-amd64-Beam.exe` |

Targets: `windows-amd64`, `windows-arm64`, `linux-amd64`, `linux-arm64`,
`darwin-amd64`, `darwin-arm64`, `darwin-universal` (macOS сначала ищет свой
arch, потом universal). Сейчас CI собирает `windows-amd64`, `linux-amd64`,
`darwin-universal`.

Источник правды по типам — `internal/application/update/ota/types.go`,
JSON Schema рядом (`ota/schema/`). Пример release-манифеста:

```json
{
  "schemaVersion": 1,
  "kind": "beam.ota.release",
  "target": "windows-amd64",
  "version": "2.1.0",
  "releasedAt": "2026-05-10T12:00:00Z",
  "mandatory": false,
  "minSupportedVersion": "1.8.0",
  "notes": { "ru": ["Исправлен реконнект после сна"], "en": ["Fixed reconnect after sleep"] },
  "files": [
    {
      "path": "Beam.exe",
      "size": 31457280,
      "sha256": "…64 hex…",
      "urls": ["https://ota-updates.acelate.com/v1/assets/v2.1.0/windows-amd64-Beam.exe"]
    }
  ]
}
```

Правила (проверяют и клиент, и `beam-ota`): версия строго `X.Y.Z`, тег релиза
всегда `v{version}`, пути файлов относительные без `..`, ссылки только https,
`minSupportedVersion` не выше версии. Неизвестные поля клиент игнорирует,
ломающее изменение = префикс `/v2/`. Манифест держим < 8 КБ (короткие notes).

## Как клиент обновляется

1. При запуске и раз в 6 часов: pointer + `.sig`, проверка ключом из
   `ota.TrustedPublicKeys`. Нет ключа / подпись не сошлась — обновления нет.
2. Версия новее — качается манифест (тоже подписан), показывается диалог с notes.
3. Файлы качаются по `urls` по очереди, сверяются размер и sha256.
4. Применение: BeamRelay (Windows), своп бандла (macOS), замена `beam` (Linux).

`mandatory` или версия ниже `minSupportedVersion` → обязательное обновление.

## Один раз: настройка

1. **Ключ подписи.** `go run ./cmd/beam-ota keygen` → `~/.beam-ota/signing.key`
   (бэкап в менеджер паролей, в git не класть). Публичный ключ — в
   `TrustedPublicKeys` в `internal/application/update/ota/sign.go`.
2. **Секреты репо `beam-desktop`** (Settings → Secrets and variables → Actions):
   - `BEAM_REPOS_TOKEN` — fine-grained PAT, Contents: read на `beam-bridge`,
     `beam-tun`, `xray-core-beam` (старое имя `BEAM_BRIDGE_TOKEN` тоже работает);
   - `BEAM_OTA_SIGNING_KEY` — содержимое `signing.key`;
   - для прокси: `OTA_PROXY_GITHUB_TOKEN`, `CLOUDFLARE_API_TOKEN`,
     `CLOUDFLARE_ACCOUNT_ID` — см. `ota-proxy/README.md`.
3. **Environment `ota`** создаётся сам при первом релизе; в Settings →
   Environments можно включить ручное подтверждение перед публикацией.
4. **Прокси и домен** — `ota-proxy/README.md`. Потом переменная
   `OTA_PROXY_READY=true`, чтобы CI после релиза проверял живой фид.

## Каждый релиз (CI)

1. Поднять `Info.productVersion` в `wails.json`.
2. Положить `release-notes/{version}.ru.txt` (и `.en.txt`) — по строке на изменение.
3. `git tag v2.0.0 && git push origin v2.0.0`.

`.github/workflows/release.yml` повторяет `scripts/*/build.*` в prod-режиме:

| Job | Что делает | Артефакты |
|---|---|---|
| windows | BeamRelay.exe (`-H=windowsgui`), wintun.dll, `wails build -nsis` | `Beam.exe`, `BeamRelay.exe`, `Beam-X-windows-amd64-installer.exe` |
| linux (ubuntu 22.04) | `wails build -tags webkit2_41` | `Beam`, `Beam-X-linux-amd64.tar.gz` (ставится `scripts/linux/install.sh --no-build`) |
| macos | `darwin/universal`, universal beam-relay в бандл, ad-hoc codesign, `Beam.zip`, DMG | `Beam.zip`, `Beam-X-macos-universal.dmg` |
| publish | подписывает фид, всё в **черновик** релиза `vX`, проверяет размеры, потом публикует | — |

Везде одинаковые ldflags: `-X main.version -X main.variant=release
-X main.buildHash=<8 символов коммита>`. Тег обязан совпадать с версией в
`wails.json`, иначе сборка падает сразу.

Вручную (Actions → Release → Run workflow): без галки `publish` — просто
сборка с артефактами; с галкой — релиз, плюс `channel` (beta = prerelease),
`mandatory`, `min_supported`, ветки соседних репо.

**Атомарность:** пока релиз черновик, прокси его не видит. Клиенты увидят
версию только после последнего шага, когда все файлы уже на месте.

**Откат:** перевести плохой релиз обратно в черновик (Edit → Save as draft) —
прокси через минуту начнёт отдавать предыдущую версию. Исправление = новая версия.

## Вручную, без CI

```bat
go run ./cmd/beam-ota publish -target windows-amd64 -live ^
  -file Beam.exe=build/bin/Beam.exe -file BeamRelay.exe=build/bin/BeamRelay.exe ^
  -notes release-notes/2.0.0.ru.txt
```

Linux: `-target linux-amd64 -file beam=build/bin/Beam`;
macOS: `-target darwin-universal -file Beam.zip=build/bin/Beam.zip`.
Нужен `gh auth login`. Без `-upload`/`-live` — только подготовит и подпишет
файлы в `build/ota/{version}/{target}`; `-upload` — зальёт в черновик,
`-live` — ещё и опубликует. Нельзя перезаписать опубликованную версию и
выпустить версию ниже уже опубликованной (оба — только с `-force`).

Проверка:

```bat
go run ./cmd/beam-ota verify                          :: живой фид, как его видит приложение
go run ./cmd/beam-ota verify -staged build/ota/2.0.0  :: подготовленные файлы до заливки
```

Доп. зеркала: `-url "https://mirror.example/{tag}/{asset}"` (пробуются после
прокси). Для теста на своём фиде: `BEAM_OTA_BASE_URL=http://127.0.0.1:8787`
(`npx wrangler dev` в `ota-proxy/`) перед запуском Beam.
