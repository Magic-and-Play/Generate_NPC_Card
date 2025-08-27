// scripts/generate-aliases.cjs
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const SRC = path.join(root, "src");
const tsconfigPath = path.join(root, "tsconfig.json");
const packageJsonPath = path.join(root, "package.json");

if (!fs.existsSync(SRC)) {
  console.error("src/ not found");
  process.exit(1);
}

function walk(dir) {
  const res = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      res.push(full);
      res.push(...walk(full));
    }
  }
  return res;
}

const dirs = [SRC, ...walk(SRC)];

const aliasMap = {}; // alias -> { srcRel, distRel }

for (const d of dirs) {
  const indexTs = path.join(d, "index.ts");
  if (!fs.existsSync(indexTs)) continue;
  // alias name = folder basename (you can change rule if needed)
  const aliasBase = path.basename(d);
  let alias = aliasBase;
  // avoid collisions by suffixing
  let suffix = 1;
  while (aliasMap[alias]) {
    alias = `${aliasBase}_${suffix++}`;
  }
  const srcRel = path.relative(SRC, indexTs).replace(/\\/g, "/"); // e.g. assets/images/icons/index.ts
  const distRel = `./dist/${srcRel.replace(/\.ts$/, ".js")}`; // ./dist/assets/images/icons/index.js
  aliasMap[alias] = { srcRel, distRel, dirs };
}

// Read and update tsconfig.json
const tsconf = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
tsconf.compilerOptions = tsconf.compilerOptions || {};
tsconf.compilerOptions.baseUrl = tsconf.compilerOptions.baseUrl || "src";
tsconf.compilerOptions.paths = tsconf.compilerOptions.paths || {};

for (const [alias, v] of Object.entries(aliasMap)) {
  // Exact alias (e.g. import from "#icons")
  tsconf.compilerOptions.paths[`#${alias}`] = [v.srcRel];
  // Also support wildcard (e.g. "#icons/...") mapping to folder/*
  const folderWildcard = v.srcRel.replace(/\/index\.ts$/, "/*");
  tsconf.compilerOptions.paths[`#${alias}/*`] = [folderWildcard];
}

// Write tsconfig.json (pretty)
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconf, null, 2), "utf8");
console.log("Updated tsconfig.json paths with", Object.keys(aliasMap).length, "aliases.");

// Read and update package.json imports (point to dist)
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
pkg.imports = pkg.imports || {};
for (const [alias, v] of Object.entries(aliasMap)) {
  pkg.imports[`#${alias}`] = v.distRel;
}
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), "utf8");
console.log("Updated package.json imports with", Object.keys(aliasMap).length, "aliases.");
