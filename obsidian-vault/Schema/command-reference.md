---
type: schema
status: active
sourceRefs:
  - scripts/wiki_tool.py
---

# Command Reference

Run from repo root:

```bash
python3 scripts/wiki_tool.py doctor
python3 scripts/wiki_tool.py build
python3 scripts/wiki_tool.py search-catalog wukir --limit 5
python3 scripts/wiki_tool.py lint
python3 scripts/wiki_tool.py source-coverage
```

All commands are local-only and must not crawl external network sources.
