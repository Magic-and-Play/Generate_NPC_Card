// scripts/generate-barrels.cjs
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const SRC = path.join(root, "src");

function walkDirs(dir) {
  const res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      res.push(full);
      res.push(...walkDirs(full));
    }
  }
  return res;
}

function ensureIndexFor(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts") && f !== "index.ts");
  if (!files.length) return false;

  // export lines with .js extension (TypeScript NodeNext resolves them to .ts)
  const lines = files.map(f => {
    const name = path.basename(f, ".ts");
    return `export * from './${name}.js';`;
  });
  const content = `// auto-generated — do not edit (scripts/generate-barrels.cjs)\n` + lines.join("\n") + "\n";
  const indexPath = path.join(dir, "index.ts");
  const prev = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : null;
  if (prev !== content) {
    fs.writeFileSync(indexPath, content, "utf8");
    console.log("WROTE", path.relative(root, indexPath));
  }
  return true;
}

// Ensure src exists
if (!fs.existsSync(SRC)) {
  console.error("No src/ folder found at", SRC);
  process.exit(1);
}

const dirs = [SRC, ...walkDirs(SRC)];
let count = 0;
for (const d of dirs) {
  if (ensureIndexFor(d)) count++;
}
console.log(`Generated/updated ${count} index.ts files.`);
