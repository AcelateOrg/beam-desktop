# Как внести вклад

Спасибо, что хотите помочь BEAM. PR и issues приветствуются.

## Перед началом

- Перед крупными изменениями откройте issue и опишите подход: так не придётся
  переделывать готовую работу.
- Отправляя PR, вы соглашаетесь с [CLA](CLA.md). Код под copyleft-лицензиями
  (GPL и т.п.) принять не можем.
- Об уязвимостях пишите не в issues, а как описано в [SECURITY.md](SECURITY.md).
- Логика VPN, профилей и подписок живёт в
  [beam-bridge](https://github.com/AcelateOrg/beam-bridge); изменения там лучше
  присылать в тот репозиторий.

## Окружение

Клонируйте соседние репозитории в одну папку (они подключены через `replace`):

```bash
git clone https://github.com/AcelateOrg/beam-desktop
git clone https://github.com/AcelateOrg/beam-bridge
git clone https://github.com/AcelateOrg/xray-core-beam
git clone https://github.com/AcelateOrg/beam-tun
```

Нужны Go 1.26, Wails CLI v2 и [Bun](https://bun.sh). Зависимости фронтенда
ставятся только через Bun (`bun install`, `bun add <пакет>`), npm не используем:
в репозитории лежит `bun.lock`.

Запуск в режиме разработки: `scripts/<ваша-ОС>/dev.bat` или `dev.sh`.
Для Linux см. [docs/linux.md](docs/linux.md).

## Процесс

1. Форкните репозиторий и создайте ветку: `git checkout -b feature/коротко-о-сути`.
2. Делайте изменения небольшими и по одной теме.
3. Проверьте перед PR:
   - `go vet ./...` и `go test ./...`;
   - фронтенд собирается: `cd frontend && bun run build`.
4. Откройте Pull Request: что изменилось и зачем, как проверяли, для UI —
   скриншоты.

## Правила кода

- `frontend/wailsjs/` генерируется Wails, руками не правьте.
- Код, зависящий от ОС, кладите в `internal/platform` с суффиксами
  `_windows.go` / `_darwin.go` / `_linux.go`.
- Для фронтенда берите готовую библиотеку, а не пишите свою замену.
