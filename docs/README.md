# Документация QAIRU HUB

Документы сгруппированы по назначению и по уровню актуальности.

## Актуальные документы

- [`product/mvp-status.md`](product/mvp-status.md) — границы, готовность и пробелы MVP;
- [`architecture/navigation-performance.md`](architecture/navigation-performance.md) — текущая схема загрузки и навигации;
- [`reference/core-api.md`](reference/core-api.md) — контракт server-to-server Core API;
- [`operations/preview-testing.md`](operations/preview-testing.md) — ручная проверка protected preview;
- [`design/README.md`](design/README.md) — где живут дизайн-система и визуальные материалы;
- [`../SECURITY.md`](../SECURITY.md) — действующие security boundaries и launch controls.

## Точечные отчёты и прототипы

- `audits/` — датированные снимки проведённых проверок; это evidence, а не всегда текущая спецификация. Структурные изменения перечислены в [`audits/repository-structure-2026-09-08.md`](audits/repository-structure-2026-09-08.md);
- `prototypes/` — экспериментальные подсистемы, которые не следует считать завершённым MVP;
- `../archive/` — неиспользуемые материалы, сохранённые для истории.

Если документ противоречит коду или более новому датированному документу, источником истины считаются исполняемый код, миграции и самый свежий аудит. При изменении статуса MVP обновляйте `product/mvp-status.md` и корневой `README.md` вместе.
