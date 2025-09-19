// build.js
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
let Library;
try {
  Library = require("./dist/library").default; // <-- version JS compilée
} catch {
  console.warn("[build] library non compilée (dist/library.js manquant)");
}
const lib = Library ? new Library() : null;

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
function copyAssets() {
  const dist = path.join(__dirname, "client", "dist");
  fs.mkdirSync(dist, { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, "client", "index.html"),
    path.join(dist, "index.html")
  );
  copyDir(path.join(__dirname, "client", "styles"),
          path.join(dist, "styles"));
  console.log(`${lib.now()} ✓ assets copiés`);
  // console.log(` ✓ assets copiés`);
}

(async () => {
  const ctx = await esbuild.context({
    entryPoints: ["client/main.tsx"],
    bundle: true,
    outfile: "client/dist/bundle.js",
    loader: { ".ts": "ts", ".tsx": "tsx" },
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    sourcemap: true,
    minify: false,
  });
  const watch = process.argv.includes("--watch");
  if (watch) {
    await ctx.watch();
    copyAssets();
    // re-copie si index.html / styles changent
    fs.watch(path.join(__dirname, "client", "index.html"), copyAssets);
    if (fs.existsSync(path.join(__dirname, "client", "styles"))) {
      fs.watch(path.join(__dirname, "client", "styles"), { recursive: true }, copyAssets);
    }
    console.log("▶ esbuild watch");
  } else {
    await ctx.rebuild();
    copyAssets();
    await ctx.dispose();
  }
})();
