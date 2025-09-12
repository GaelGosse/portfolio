const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// Compilation React/TSX
esbuild.build({
	entryPoints: ["client/main.tsx"],
	bundle: true,
	outfile: "client/dist/bundle.js",
	loader: {
		".ts": "ts",
		".tsx": "tsx",
	},
	jsxFactory: "React.createElement",
	jsxFragment: "React.Fragment",
	sourcemap: true,
	minify: false,
}).then(() => {
	// Vérifie que client/dist existe
	const distDir = path.join(__dirname, "client", "dist");
	if (!fs.existsSync(distDir))
	{
		fs.mkdirSync(distDir, { recursive: true });
	}

	// Copie index.html
	fs.copyFileSync(
		path.join(__dirname, "client", "index.html"),
		path.join(distDir, "index.html")
	);
	const src = path.join(__dirname, "client", "styles");
	const dst = path.join(__dirname, "client", "dist", "styles");
	if (fs.existsSync(src))
	{
		fs.mkdirSync(dst, { recursive: true });
		for (const f of fs.readdirSync(src))
		{
			fs.copyFileSync(path.join(src, f), path.join(dst, f));
		}
	}

	console.log("✅ Build complet : bundle.js + index.html");
}).catch((err) =>
{
	console.error("❌ Build échoué :", err);
	process.exit(1);
});
