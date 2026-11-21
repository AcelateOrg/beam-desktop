# Release notes

The release workflow puts `{version}.ru.txt` and `{version}.en.txt` from
this folder into the update dialog (and the GitHub release body), e.g.
`2.0.0.ru.txt`. One change per line; blank lines, `#` comments and
`- ` / `* ` bullets are ignored. Keep it short: the whole manifest should
stay under 8 KB.

```
# 2.0.0
- Новый редактор ProTun
- Обновления теперь подписаны
```
