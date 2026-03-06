# Codex Milky Way Lab

This folder now contains multiple Codex-only browse variants. Claude's work remains untouched in the separate `claude/` folder.

## Variants

- `index.html`: launcher page for all Codex variants.
- `versions/staged/`: baseline staged canvas prototype.
- `versions/cinematic/`: guided story-first version with autoplay and manual timeline scrub.
- `versions/explorer/`: hybrid browse with semantic zoom, minimap, keyboard movement, and landmark focus.

## Run

Serve `codex/` over local HTTP so each version can load its JSON scene file.

```sh
cd /Users/pleddy/docs/cloudautomat/code/projects/milkywayhw/codex
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
