# Pre-LLM Development Estimate: Space Visualization Project

*Estimated man-hours for a senior Three.js / WebGL developer (solo) — traditional development without AI assistance*

---

## Solar System Map
*~2,700 lines · Single-file HTML/JS/CSS*

| Component | Low | High | Mid | Claude | Notes |
|:---|---:|---:|---:|---:|:---|
| Orbital mechanics (Kepler solver) | 40 | 60 | 50 | ~8s | Mean/eccentric anomaly, elliptical orbits, inclination, argument of perihelion |
| Asinh distance compression | 12 | 20 | 16 | ~3s | Custom non-linear scale with smooth near-origin behavior; lots of tuning |
| Procedural planet textures (×10 types) | 60 | 100 | 80 | ~12s | Earth continents+clouds, Jupiter bands+GRS, Saturn rings, ice giants, cratered, etc. |
| Sun rendering + glow layers | 8 | 16 | 12 | ~2s | Additive blending sprites, pulse animation, opacity management |
| 3D navigator (orbit camera + flyTo) | 24 | 40 | 32 | ~5s | Smooth lerp, pitch/yaw, scroll zoom with log scaling, keyboard nav |
| Planet/moon/comet data entry | 16 | 24 | 20 | ~6s | 34 bodies with orbital params, descriptions, classification, moon hierarchies |
| Particle belts (asteroid + Kuiper) | 8 | 12 | 10 | ~2s | Randomized particle distributions, proper orbital zone ranges |
| Comet tails + extreme orbits | 12 | 20 | 16 | ~3s | Tail sprites pointing away from Sun, near-parabolic orbit rendering, arc clamping |
| UI: info cards, HUD, minimap | 24 | 40 | 32 | ~6s | Photo-viewer card, live orbital coords, zoom indicator, canvas minimap |
| Tour system (scripted flythrough) | 20 | 32 | 26 | ~5s | Stop sequencing, narration, auto-advance, camera interpolation |
| Labels + hover tooltips | 8 | 12 | 10 | ~2s | Canvas text sprites, distance-adaptive scaling, raycaster hover |
| Layer toggle system | 6 | 10 | 8 | ~2s | Checkbox panel, visibility cascading through groups, keyboard shortcuts |
| Smart double-click (screen-space snap) | 8 | 16 | 12 | ~3s | Project all bodies to screen coords, find nearest, handle edge cases |
| Habitable zone visualization | 4 | 6 | 5 | ~1s | Annular ring at correct AU range, transparency, layer integration |
| Hill sphere visualization | 12 | 20 | 16 | ~4s | Per-planet gravity zones, wireframe + fill, real-time position tracking |
| Actual Size toggle | 8 | 16 | 12 | ~3s | Real AU radius math, render-loop override handling, educational UX |
| Help overlay + Log Truth overlay | 6 | 10 | 8 | ~2s | Styled popups, keyboard wiring, educational copy |
| Arrow key cycling + nav buttons | 4 | 8 | 6 | ~1s | Index tracking, flyTo integration, button wiring |
| Cross-browser testing + polish | 16 | 24 | 20 | ~0s | WebGL compat, touch events, mobile, performance optimization |
| **SOLAR SYSTEM SUBTOTAL** | **296** | **486** | **391** | **~70s** | |

---

## Milky Way Map
*~2,700 lines · Procedural galaxy with 80k+ particles*

| Component | Low | High | Mid | Claude | Notes |
|:---|---:|---:|---:|---:|:---|
| Galaxy structure (spiral arms algorithm) | 32 | 48 | 40 | ~7s | Logarithmic spiral math, arm count/width/winding, per-particle color variance |
| Galactic core + bar + bulge | 16 | 24 | 20 | ~4s | Core density distribution, bar geometry, dimming gradient |
| Background stars + disk fill particles | 12 | 20 | 16 | ~3s | Random distributions, GlowTexture map, depth/transparency handling |
| Notable stars data (40+ entries) | 24 | 40 | 32 | ~8s | Research, position estimation, descriptions, planet sub-entries, sky descriptions |
| Procedural star textures | 16 | 24 | 20 | ~4s | Per-spectral-type rendering, glow layers, size categories |
| 3D navigator (reused + extended) | 12 | 20 | 16 | ~3s | Same orbit camera with galaxy-specific tuning, WASD nav (later removed) |
| Sector grid + coordinate grid | 12 | 20 | 16 | ~3s | Named galactic sectors, lat/long lines, toggle system |
| Photo-viewer card + star info | 16 | 24 | 20 | ~4s | Procedural star portrait, spectral class display, planet listings |
| Tour system (galaxy edition) | 16 | 24 | 20 | ~4s | Different stops, narration, galaxy-scale camera movements |
| Mode switcher (All/Planets/Stars) | 8 | 12 | 10 | ~2s | Filter logic, button UI, visibility cascading |
| Per-star distance scaling | 8 | 12 | 10 | ~2s | Camera-distance-based sprite scaling to prevent jitter (tricky bug fix) |
| depthWrite / transparency fixes | 8 | 16 | 12 | ~3s | Black box debugging, PointsMaterial configuration across 4 systems |
| Center dimming (radial fade) | 6 | 10 | 8 | ~2s | Vertex color modulation, core opacity reduction, smooth gradient |
| Smart double-click + arrow cycling | 8 | 12 | 10 | ~2s | Screen-space projection, selection tracking, UI buttons |
| Actual Size toggle | 6 | 10 | 8 | ~2s | Scene traversal, PointsMaterial size override, sprite scaling |
| UI: layers, help, Log Truth, overlays | 10 | 16 | 13 | ~3s | Panel system, hotkeys, educational content |
| Cross-browser testing + polish | 12 | 20 | 16 | ~0s | Performance with 80k particles, WebGL limits, mobile |
| **MILKY WAY SUBTOTAL** | **222** | **352** | **287** | **~56s** | |

---

## Galaxy Explorer Map
*~1,400 lines · Real astronomical data, 50+ galaxies*

| Component | Low | High | Mid | Claude | Notes |
|:---|---:|---:|---:|---:|:---|
| Galaxy data research + entry | 20 | 32 | 26 | ~6s | RA/Dec/distance for 50+ galaxies, classifications, descriptions, image URLs |
| Sinh-compressed 3D positioning | 12 | 20 | 16 | ~3s | Convert RA/Dec/distance to 3D scene coords with distance compression |
| Procedural galaxy textures | 16 | 24 | 20 | ~4s | Per-morphology rendering (spiral, elliptical, irregular, lenticular) |
| RA/Dec grid + Mpc distance grid | 12 | 20 | 16 | ~3s | Astronomical coordinate overlays, distance shells, labels |
| Info panel + galaxy images | 12 | 20 | 16 | ~3s | Detail cards, Wikipedia image loading, pulsing detail indicators |
| Drunken tour (Elon's tour) | 8 | 12 | 10 | ~2s | Randomized flythrough with comedic narration banners |
| Navigator + smart double-click | 10 | 16 | 13 | ~3s | Orbit camera, plane intersection fallback, nearest-galaxy snap |
| Arrow cycling + nav buttons | 4 | 8 | 6 | ~1s | Galaxy index tracking, flyTo, button wiring |
| Help overlay + Log Truth + Actual Size | 8 | 12 | 10 | ~2s | Educational overlays, hotkeys, galaxy scaling toggle |
| Cross-browser testing + polish | 8 | 12 | 10 | ~0s | Lighter map but still WebGL + sprite management |
| **GALAXY EXPLORER SUBTOTAL** | **110** | **176** | **143** | **~27s** | |

---

## Cross-Cutting Work
*Shared across all three maps*

| Component | Low | High | Mid | Claude | Notes |
|:---|---:|---:|---:|---:|:---|
| Architecture + project setup | 8 | 16 | 12 | ~2s | File structure decisions, CDN management, shared patterns |
| Cross-map navigation links | 4 | 6 | 5 | ~1s | Consistent link bar, styling, placement |
| Consistent UX patterns | 12 | 20 | 16 | ~3s | Help button style, green glow animation, overlay patterns, hotkey conventions |
| Bug investigation + debugging | 24 | 40 | 32 | ~12s | Black hole Sun, flyTo targeting (0,0,0), depth buffer issues, jitter, etc. |
| Iterative design feedback loops | 20 | 40 | 30 | ~6s | Back-and-forth with stakeholder on dimming, zoom distances, label placement |
| Research + fact-checking | 16 | 24 | 20 | ~3s | Orbital parameters, star positions, galaxy distances, educational accuracy |
| **CROSS-CUTTING SUBTOTAL** | **84** | **146** | **115** | **~27s** | |

---

## Grand Total

| | Low (hrs) | High (hrs) | Mid (hrs) | Claude |
|:---|---:|---:|---:|---:|
| **ALL THREE MAPS** | **712** | **1,160** | **936** | **~180s** |

---

## Cost Estimates

| Scenario | Low | High | Mid | Notes |
|:---|---:|---:|---:|:---|
| Solo senior dev ($125/hr) | $89,000 | $145,000 | $117,000 | US market rate for senior Three.js/WebGL specialist |
| Small team (dev+designer+advisor) | $124,600 | $203,000 | $163,800 | Blended rate including design & science review |
| Agency / contractor shop | $160,200 | $261,000 | $210,600 | Typical agency rate with PM overhead |
| Claude (Opus 4.6) | | | ~$0.75 | API token cost. No benefits package required. |

## Timeline Estimates

| Scenario | Low | High | Mid | Notes |
|:---|---:|---:|---:|:---|
| Solo dev (full-time) | 4.5 mo | 7.3 mo | 5.9 mo | 160 hrs/month — no vacations, no context switching |
| Small team (2-3 people) | 2.2 mo | 3.6 mo | 2.9 mo | Months with parallelism but communication overhead |
| **With LLM assistance (this project)** | | **~20 hrs total** | | ~20 hours of conversation over a few sessions |

---

*Speedup factor: ~60-80× compared to traditional development. The iterative design loop (dimming, zoom tuning, bug hunting, educational features) accounts for most of the savings.*

*The "Claude" column represents estimated wall-clock compute time per component. The human mid estimate of 936 hours equals 3,369,600 seconds. Claude's 180 seconds is a mass_earth ratio of 0.0000534 — smaller than Mercury's Hill sphere.*
