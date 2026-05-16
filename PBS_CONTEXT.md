Current PBS direction:
- Daydream mode = Seed-to-Future Association Engine.
- Player gives a seed: poem/song/artwork explanation/curatorial text/photo artwork explanation.
- Engine finds related local wiki/interview/persona content.
- Generates associations and future scenarios:
  “這個東西的未來可以變成什麼？”
- Manual/testable report engine, no cron and no background automation.

Repo:
- Working folder: /Users/weiweiweiwei/Documents/Projects/peach-blossom-spring-latest
- Branch: main
- Git root must be this folder. If not, stop.

Guardrails:
- Do not edit data/personas.json.
- Do not push/deploy unless explicitly asked.
- Do not delete data.
- Do not expose secrets.
- Do not rewrite the whole UI.
- Do not import/copy the whole mirofish project.
- Do not touch untracked folders:
  - multiplayer-worker/.wrangler/
  - obsidian-vault/
  - prompts/
- Avoid unrelated language/menu/layout changes.

Working style:
- Small vertical slice.
- Before editing: run pwd, git rev-parse --show-toplevel, git status --short --branch.
- After editing: run tests/build if available.
- Report files changed, commands run, and caveats.
