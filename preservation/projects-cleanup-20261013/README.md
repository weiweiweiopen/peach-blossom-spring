# Reviewed local source preservation — 2026-10-13

This branch retains the complete public base tree unchanged and adds complete reviewed source files under `local-source/`, with original relative paths and SHA256 in manifest.json. These are real source files, not an isolated diff. No deployment or merge is requested.

## Scope and blocker

This is NOT a complete backup of the local project and NOT a verified build of the local changes. The local variant changes Association imports to Daydream and imports a generated local memory index. Several additional Daydream modules could not be read from iCloud, and the provenance/publication status of generated local memory and other data is not established. Those inputs, all private vault/chat data, environment files and local source folders remain local and were not uploaded or deleted.

## Retrieve

Clone this repository at branch `preservation/projects-cleanup-20261013`. The repository root is the unchanged public base build tree. `local-source/` contains the reviewed local variants; copy them to their original relative paths only in a separate restoration checkout after recovering and reviewing the missing dependencies. Do not deploy this preservation snapshot. See manifest.json for exact scope and omissions.
