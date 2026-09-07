/**
 * Prisma 6.19.x workaround — creates missing engine stub files.
 *
 * Prisma CLI >=6.19 uses a renamed WASM file (query_compiler_fast_bg.*)
 * but the code path that triggers on postgres+client generator still looks
 * for the old name (query_engine_bg.*). This script creates a copy under
 * the expected name so `prisma generate` can succeed.
 *
 * Run: node scripts/prisma-stub-fix.js
 * Called automatically via the "pregenerate" and "postinstall" hooks.
 */

const fs = require("fs");
const path = require("path");

const runtimeDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "@prisma",
  "client",
  "runtime"
);

const filesToCopy = [
  ["query_compiler_fast_bg.postgresql.wasm-base64.js", "query_engine_bg.postgresql.wasm-base64.js"],
  ["query_compiler_fast_bg.postgresql.js",            "query_engine_bg.postgresql.js"],
];

// In Prisma 6.19.x, library.js was renamed to client.js but generated
// client code (node_modules/.prisma/client/index.js) still requires library.js.
let anyFixed = false;

const libraryStub = path.join(runtimeDir, "library.js");
if (!fs.existsSync(libraryStub) && fs.existsSync(path.join(runtimeDir, "client.js"))) {
  fs.writeFileSync(libraryStub, "module.exports = require('./client.js');\n");
  console.log("[prisma-stub-fix] Created library.js -> client.js stub");
  anyFixed = true;
}

for (const [src, dest] of filesToCopy) {
  const srcPath  = path.join(runtimeDir, src);
  const destPath = path.join(runtimeDir, dest);

  if (!fs.existsSync(srcPath)) {
    // Source doesn't exist either — different Prisma version, nothing to do.
    continue;
  }

  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`[prisma-stub-fix] Created ${dest}`);
    anyFixed = true;
  }
}

if (!anyFixed) {
  console.log("[prisma-stub-fix] All stubs already in place, nothing to do.");
}
