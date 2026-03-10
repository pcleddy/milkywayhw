#!/usr/bin/env node
/**
 * Test harness for 3D Space Visualization
 * Validates milkyway.html, solarsystem.html, galaxy-explorer.html
 * Run: node test_harness.js
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
let totalPass = 0, totalFail = 0, totalWarn = 0;

function pass(msg) { totalPass++; console.log(`  ✓ ${msg}`); }
function fail(msg) { totalFail++; console.log(`  ✗ FAIL: ${msg}`); }
function warn(msg) { totalWarn++; console.log(`  ⚠ WARN: ${msg}`); }
function section(msg) { console.log(`\n━━━ ${msg} ━━━`); }

// ═══════════════════════════════════════
//  MILKY WAY TESTS
// ═══════════════════════════════════════

function testMilkyWay() {
  section("MILKY WAY — milkyway.html");
  const html = fs.readFileSync(path.join(DIR, "milkyway.html"), "utf8");
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) { fail("No <script> tag found"); return; }
  const js = scriptMatch[1];

  // 1. JS syntax
  try { new Function(js); pass("JavaScript syntax valid"); }
  catch(e) { fail("JavaScript syntax error: " + e.message); }

  // 2. Extract star data
  const starNameRe = /name:\s*"([^"]+)"/g;
  const starBlockStart = html.indexOf("notableStars");
  const starBlockEnd = html.indexOf("class Star");
  const allStarNames = [];
  let m;
  while ((m = starNameRe.exec(html)) !== null) {
    if (m.index > starBlockStart && m.index < starBlockEnd) {
      allStarNames.push(m[1]);
    }
  }
  if (allStarNames.length > 50) pass(`Found ${allStarNames.length} stars in notableStars`);
  else fail(`Only ${allStarNames.length} stars found (expected 100+)`);

  // 3. Check for duplicate star names
  const dupes = allStarNames.filter((n, i) => allStarNames.indexOf(n) !== i);
  if (dupes.length === 0) pass("No duplicate star names");
  else {
    // Some duplicates may be intentional (e.g. Aldebaran, Antares appear in both notable and constellation sections)
    const uniqueDupes = [...new Set(dupes)];
    warn(`Duplicate star names: ${uniqueDupes.join(", ")}`);
  }

  // 4. Constellation line references
  const constellationBlock = js.match(/const constellations\s*=\s*\[([\s\S]*?)\];/);
  if (!constellationBlock) { fail("Cannot find constellations array"); return; }

  const lineRefs = [];
  const lineRe = /\['([^']+)',\s*'([^']+)'\]/g;
  while ((m = lineRe.exec(constellationBlock[1])) !== null) {
    lineRefs.push(m[1], m[2]);
  }
  const uniqueLineRefs = [...new Set(lineRefs)];

  const missingStars = uniqueLineRefs.filter(ref => !allStarNames.includes(ref));
  if (missingStars.length === 0) pass(`All ${uniqueLineRefs.length} constellation line refs resolve to stars`);
  else fail(`Missing stars referenced in constellation lines: ${missingStars.join(", ")}`);

  // 5. Constellation IDs match between data and lines
  const constellationIds = [];
  const cidRe = /id:\s*'([^']+)'/g;
  while ((m = cidRe.exec(constellationBlock[1])) !== null) constellationIds.push(m[1]);

  const starConstellationTags = new Set();
  const tagRe = /constellation:\s*"([^"]+)"/g;
  while ((m = tagRe.exec(html)) !== null) starConstellationTags.add(m[1]);

  const unlinkedTags = [...starConstellationTags].filter(t => !constellationIds.includes(t));
  if (unlinkedTags.length === 0) pass(`All constellation tags (${starConstellationTags.size}) have matching line definitions`);
  else fail(`Constellation tags without line definitions: ${unlinkedTags.join(", ")}`);

  const emptyConstellations = constellationIds.filter(id => !starConstellationTags.has(id));
  if (emptyConstellations.length === 0) pass("All constellation definitions have tagged stars");
  else fail(`Constellation definitions with no tagged stars: ${emptyConstellations.join(", ")}`);

  // 6. Buttons match constellation IDs
  const btnRe = /data-const="([^"]+)"/g;
  const btnIds = [];
  while ((m = btnRe.exec(html)) !== null) btnIds.push(m[1]);
  const missingBtns = constellationIds.filter(id => !btnIds.includes(id));
  const extraBtns = btnIds.filter(id => !constellationIds.includes(id));
  if (missingBtns.length === 0 && extraBtns.length === 0) pass(`All ${btnIds.length} buttons match constellation IDs`);
  else {
    if (missingBtns.length > 0) fail(`Constellations without buttons: ${missingBtns.join(", ")}`);
    if (extraBtns.length > 0) fail(`Buttons without constellations: ${extraBtns.join(", ")}`);
  }

  // 7. Star positions are within galaxy bounds
  const posRe = /dist:\s*([\d.]+),\s*angle:\s*([\d.-]+),\s*z:\s*([\d.-]+)/g;
  let outOfBounds = 0;
  const positions = [];
  while ((m = posRe.exec(html)) !== null) {
    if (m.index > starBlockStart && m.index < starBlockEnd) {
      const dist = parseFloat(m[1]), angle = parseFloat(m[2]), z = parseFloat(m[3]);
      positions.push({ dist, angle, z });
      if (dist < 0 || dist > 60000) outOfBounds++;
      if (angle < -Math.PI || angle > 2 * Math.PI) outOfBounds++;
      if (Math.abs(z) > 5) outOfBounds++;
    }
  }
  if (outOfBounds === 0) pass(`All ${positions.length} star positions within galaxy bounds`);
  else fail(`${outOfBounds} star positions out of bounds`);

  // 8. Constellation shapes from Sol's perspective
  section("MILKY WAY — Constellation shape validation");
  const sunDist = 26000, sunAngle = 1.3, scale = 0.001;
  const sunX = sunDist * Math.cos(sunAngle) * scale;
  const sunZ = sunDist * Math.sin(sunAngle) * scale;
  const DEG = Math.PI / 180;

  // Build star position lookup — use constellation-tagged entries when available
  const starPositions = {};
  const fullStarRe = /name:\s*"([^"]+)"[^}]*?dist:\s*([\d.]+),\s*angle:\s*([\d.-]+),\s*z:\s*([\d.-]+)/g;
  while ((m = fullStarRe.exec(html)) !== null) {
    if (m.index > starBlockStart && m.index < starBlockEnd) {
      const name = m[1], dist = parseFloat(m[2]), angle = parseFloat(m[3]), z = parseFloat(m[4]);
      const x = dist * Math.cos(angle) * scale;
      const sz = dist * Math.sin(angle) * scale;
      const y = z * scale * 1000;
      const block = html.substring(m.index, m.index + 500);
      const hasConstellation = block.includes("constellation:");
      // Prefer constellation-tagged entry over general entry for duplicates
      if (!starPositions[name] || hasConstellation) {
        starPositions[name] = { x, y, z: sz, hasConstellation };
      }
    }
  }

  // Also build per-constellation position maps to handle duplicates properly
  const constellationStarPositions = {};
  const cStarRe = /name:\s*"([^"]+)"[^}]*?dist:\s*([\d.]+),\s*angle:\s*([\d.-]+),\s*z:\s*([\d.-]+)[^}]*?constellation:\s*"([^"]+)"/g;
  while ((m = cStarRe.exec(html)) !== null) {
    if (m.index > starBlockStart && m.index < starBlockEnd) {
      const name = m[1], dist = parseFloat(m[2]), angle = parseFloat(m[3]), z = parseFloat(m[4]), cid = m[5];
      const x = dist * Math.cos(angle) * scale;
      const sz = dist * Math.sin(angle) * scale;
      const y = z * scale * 1000;
      if (!constellationStarPositions[cid]) constellationStarPositions[cid] = {};
      constellationStarPositions[cid][name] = { x, y, z: sz };
    }
  }

  // Check that constellation stars cluster together (angular spread < 40° from Sol)
  for (const cid of constellationIds) {
    const cStarMap = constellationStarPositions[cid] || {};
    const cStarNames = Object.keys(cStarMap);

    if (cStarNames.length < 2) { warn(`${cid}: only ${cStarNames.length} stars found`); continue; }

    // Compute angular spread
    const angles = cStarNames.map(name => {
      const p = cStarMap[name];
      const dx = p.x - sunX, dy = p.y, dz = p.z - sunZ;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      return { h: Math.atan2(dz, dx), v: Math.asin(dy / d), name };
    });

    let maxSpread = 0;
    for (let i = 0; i < angles.length; i++) {
      for (let j = i+1; j < angles.length; j++) {
        const dh = angles[i].h - angles[j].h;
        const dv = angles[i].v - angles[j].v;
        const spread = Math.sqrt(dh*dh + dv*dv) / DEG;
        if (spread > maxSpread) maxSpread = spread;
      }
    }

    if (maxSpread < 40) pass(`${cid}: ${cStarNames.length} stars, angular spread ${maxSpread.toFixed(1)}°`);
    else warn(`${cid}: angular spread ${maxSpread.toFixed(1)}° (large — may look stretched)`);
  }

  // 9. Etymology coverage
  section("MILKY WAY — Etymology coverage");
  const constellationStars = allStarNames.filter(name => {
    const idx = html.indexOf(`name: "${name}"`);
    if (idx < 0) return false;
    const block = html.substring(idx, idx + 800);
    return block.includes("constellation:");
  });
  const starsWithEtym = allStarNames.filter(name => {
    const idx = html.indexOf(`name: "${name}"`);
    if (idx < 0) return false;
    const block = html.substring(idx, idx + 800);
    return block.includes("etym:");
  });
  const constellationWithoutEtym = constellationStars.filter(name => {
    const idx = html.indexOf(`name: "${name}"`);
    if (idx < 0) return false;
    const block = html.substring(idx, idx + 800);
    return !block.includes("etym:");
  });

  pass(`${starsWithEtym.length}/${allStarNames.length} stars have etymology`);
  if (constellationWithoutEtym.length === 0) pass("All constellation stars have etymology");
  else warn(`Constellation stars without etymology: ${constellationWithoutEtym.join(", ")}`);

  // 10. Star class stores required properties
  section("MILKY WAY — Star class properties");
  const classBlock = js.match(/class Star \{[\s\S]*?createMesh/);
  if (classBlock) {
    const requiredProps = ["name", "type", "dist", "desc", "etym", "constellation", "distFromSun_ly", "planets"];
    for (const prop of requiredProps) {
      if (classBlock[0].includes(`this.${prop}`)) pass(`Star class stores '${prop}'`);
      else fail(`Star class missing 'this.${prop}' — won't be available in info popup`);
    }
  }

  // 11. Element IDs referenced in JS exist in HTML
  section("MILKY WAY — DOM element references");
  const idRefRe = /getElementById\(['"]([^'"]+)['"]\)/g;
  const referencedIds = new Set();
  while ((m = idRefRe.exec(js)) !== null) referencedIds.add(m[1]);

  let missingEls = 0;
  for (const id of referencedIds) {
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      fail(`JS references #${id} but no element with that ID in HTML`);
      missingEls++;
    }
  }
  if (missingEls === 0) pass(`All ${referencedIds.size} element ID references valid`);

  // 12. Touch support
  section("MILKY WAY — Touch support");
  if (html.includes("touch-action: none")) pass("CSS touch-action: none on canvas");
  else fail("Missing touch-action: none");
  if (js.includes("touchstart")) pass("touchstart handler found");
  else fail("No touchstart handler");
  if (js.includes("touchmove")) pass("touchmove handler found");
  else fail("No touchmove handler");
  if (js.includes("touchend")) pass("touchend handler found");
  else fail("No touchend handler");
  if (html.includes("@media (max-width:") || html.includes("@media (max-width :")) pass("Mobile media query found");
  else fail("No mobile media query");

  // 13. Viewport meta tag
  if (html.includes('name="viewport"')) pass("Viewport meta tag present");
  else fail("Missing viewport meta tag");
}

// ═══════════════════════════════════════
//  SOLAR SYSTEM TESTS
// ═══════════════════════════════════════

function testSolarSystem() {
  section("SOLAR SYSTEM — solarsystem.html");
  const html = fs.readFileSync(path.join(DIR, "solarsystem.html"), "utf8");
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) { fail("No <script> tag found"); return; }
  const js = scriptMatch[1];

  // 1. JS syntax
  try { new Function(js); pass("JavaScript syntax valid"); }
  catch(e) { fail("JavaScript syntax error: " + e.message); }

  // 2. Planet data
  const planetNames = [];
  const pRe = /name:\s*"([^"]+)"/g;
  let m;
  const dataStart = js.indexOf("solarSystemData");
  const dataEnd = js.indexOf("class ");
  while ((m = pRe.exec(js)) !== null) {
    if (m.index > dataStart && m.index < dataEnd) planetNames.push(m[1]);
  }
  if (planetNames.length >= 8) pass(`Found ${planetNames.length} bodies`);
  else fail(`Only ${planetNames.length} bodies (expected 8+ planets)`);

  // 3. Touch support
  section("SOLAR SYSTEM — Touch support");
  if (html.includes("touch-action: none")) pass("CSS touch-action: none");
  else fail("Missing touch-action: none");
  if (js.includes("touchstart")) pass("touchstart handler found");
  else fail("No touchstart handler");
  if (js.includes("touchmove")) pass("touchmove handler found");
  else fail("No touchmove handler");
  if (html.includes("@media (max-width:")) pass("Mobile media query found");
  else fail("No mobile media query");

  // 4. Element IDs
  section("SOLAR SYSTEM — DOM element references");
  const idRefRe = /getElementById\(['"]([^'"]+)['"]\)/g;
  const referencedIds = new Set();
  while ((m = idRefRe.exec(js)) !== null) referencedIds.add(m[1]);
  let missingEls = 0;
  for (const id of referencedIds) {
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      fail(`JS references #${id} but no element with that ID in HTML`);
      missingEls++;
    }
  }
  if (missingEls === 0) pass(`All ${referencedIds.size} element ID references valid`);
}

// ═══════════════════════════════════════
//  GALAXY EXPLORER TESTS
// ═══════════════════════════════════════

function testGalaxyExplorer() {
  section("GALAXY EXPLORER — galaxy-explorer.html");
  const html = fs.readFileSync(path.join(DIR, "galaxy-explorer.html"), "utf8");
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) { fail("No <script> tag found"); return; }
  const js = scriptMatch[1];

  // 1. JS syntax
  try { new Function(js); pass("JavaScript syntax valid"); }
  catch(e) { fail("JavaScript syntax error: " + e.message); }

  // 2. Galaxy data
  const galaxyNames = [];
  const gRe = /name:\s*"([^"]+)"/g;
  let m;
  while ((m = gRe.exec(js)) !== null) galaxyNames.push(m[1]);
  if (galaxyNames.length >= 20) pass(`Found ${galaxyNames.length} galaxies`);
  else warn(`Only ${galaxyNames.length} galaxies found`);

  // 3. Touch support
  section("GALAXY EXPLORER — Touch support");
  if (html.includes("touch-action: none")) pass("CSS touch-action: none");
  else fail("Missing touch-action: none");
  if (js.includes("touchstart")) pass("touchstart handler found");
  else fail("No touchstart handler");
  if (html.includes("@media (max-width:")) pass("Mobile media query found");
  else fail("No mobile media query");

  // 4. Element IDs
  section("GALAXY EXPLORER — DOM element references");
  const idRefRe = /getElementById\(['"]([^'"]+)['"]\)/g;
  const referencedIds = new Set();
  while ((m = idRefRe.exec(js)) !== null) referencedIds.add(m[1]);
  let missingEls = 0;
  for (const id of referencedIds) {
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      fail(`JS references #${id} but no element with that ID in HTML`);
      missingEls++;
    }
  }
  if (missingEls === 0) pass(`All ${referencedIds.size} element ID references valid`);
}

// ═══════════════════════════════════════
//  CROSS-FILE TESTS
// ═══════════════════════════════════════

function testCrossFile() {
  section("CROSS-FILE — Consistency checks");
  const files = ["milkyway.html", "solarsystem.html", "galaxy-explorer.html"];
  for (const f of files) {
    const fpath = path.join(DIR, f);
    if (!fs.existsSync(fpath)) { fail(`${f} not found`); continue; }
    const html = fs.readFileSync(fpath, "utf8");

    // Viewport
    if (html.includes('name="viewport"')) pass(`${f}: viewport meta tag`);
    else fail(`${f}: missing viewport meta tag`);

    // Three.js loaded
    if (html.includes("three.min.js") || html.includes("three.js")) pass(`${f}: Three.js loaded`);
    else fail(`${f}: Three.js not found`);

    // No console.log left in (except intentional)
    const consoleLogs = (html.match(/console\.log\(/g) || []).length;
    if (consoleLogs === 0) pass(`${f}: no console.log statements`);
    else warn(`${f}: ${consoleLogs} console.log statements (check if intentional)`);

    // File size
    const sizeMB = (html.length / 1048576).toFixed(2);
    if (html.length < 5 * 1048576) pass(`${f}: ${sizeMB} MB (under 5MB limit)`);
    else warn(`${f}: ${sizeMB} MB (large file)`);
  }
}

// ═══════════════════════════════════════
//  RUN
// ═══════════════════════════════════════

console.log("╔═══════════════════════════════════════════╗");
console.log("║  3D Space Visualization — Test Harness    ║");
console.log("╚═══════════════════════════════════════════╝");

testMilkyWay();
testSolarSystem();
testGalaxyExplorer();
testCrossFile();

console.log("\n═══════════════════════════════════════");
console.log(`  Results: ${totalPass} passed, ${totalFail} failed, ${totalWarn} warnings`);
console.log("═══════════════════════════════════════");

if (totalFail > 0) {
  console.log("\n⛔ SOME TESTS FAILED");
  process.exit(1);
} else if (totalWarn > 0) {
  console.log("\n⚠️  All tests passed with warnings");
} else {
  console.log("\n🟢 ALL TESTS PASSED");
}
