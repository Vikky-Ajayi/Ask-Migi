// Plain ES module — no tsx/TypeScript tooling required at build time.
// This is intentional: Railway's production npm install omits devDependencies,
// so the build runner must be a plain .mjs file executable by node directly.
//
// All npm packages are marked external (packages: "external") so esbuild only
// transpiles TypeScript and does NOT attempt to bundle node_modules. This means
// the build succeeds even when npm's install step ends with a partial install
// (the known "Exit handler never called!" crash in Railway's build environment).
// All packages are available at runtime from node_modules anyway.

import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    packages: "external",   // all node_modules left as require() at runtime
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: false,          // keep readable for easier runtime debugging
    logLevel: "info",
  });

  console.log("build complete.");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
