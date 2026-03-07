# Space Explorer

Three interactive 3D browsers that let you explore the universe at different scales — from the intergalactic neighborhood down to the moons of Jupiter. Each is a single self-contained HTML file built with Three.js, no build step, no dependencies beyond a CDN-loaded library.

## Live

- **[Galaxy Explorer](https://pcleddy.github.io/milkywayhw/claude/galaxy-explorer.html)** — 62 galaxies in 3D, positioned by real RA/Dec coordinates with log-compressed distances. Includes Mpc distance grid, RA/Dec celestial grid, and a nested 2D solar system view you can enter by clicking the Milky Way. Some galaxies have real photographs sourced from Wikimedia Commons.

- **[Milky Way](https://pcleddy.github.io/milkywayhw/claude/milkyway.html)** — 12,000 background stars, four spiral arms (Perseus, Sagittarius, Scutum-Centaurus, Norma), notable objects from Sagittarius A* to Tabby's Star, globular clusters, satellite galaxies, and exoplanet systems with real orbital data. Narrated tour included.

- **[Solar System](https://pcleddy.github.io/milkywayhw/claude/solarsystem.html)** — The Sun, all 8 planets, 5 dwarf planets, ~20 moons, and the asteroid and Kuiper belts. Log-scale distances keep Mercury and Neptune both visible without scrolling for an hour. 21-stop narrated tour from the Sun to Eris.

## How it works

Everything renders in the browser. No server, no database. Each file is a complete application — HTML structure, CSS, and all JavaScript in one file. The 3D scenes use Three.js r128 loaded from CDN. Navigation is mouse/trackpad: drag to orbit, scroll to zoom, double-click to recenter on an object.

Distances are log-compressed at every scale. Real proportions would make the inner solar system a single pixel when zoomed to show Neptune, and the Local Group would be empty space with a dot at the center if displayed linearly. The compression `log10(distance + 1) * scale` keeps everything explorable while preserving relative ordering.

Galaxy positions come from real catalog data — RA and Dec converted to 3D cartesian coordinates. Star positions in the Milky Way are placed along modeled spiral arms using logarithmic spiral equations with gaussian spread. Planet distances use actual AU values from NASA/JPL, log-compressed to fit a navigable scene.

## What's in here

```
claude/
  galaxy-explorer.html   62 galaxies, 3D RA/Dec positioning, Mpc grid
  milkyway.html          Milky Way structure, notable stars, exoplanets
  solarsystem.html       Planets, moons, dwarf planets, belts
images/                  Galaxy photographs (hosted on S3, referenced by URL)
```

## Built with

Single-file HTML + Three.js + a conversation with Claude.
