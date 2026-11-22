import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const requireElectron = createRequire(path.join(root, "electron", "package.json"));

function assertNoNativeBinaries(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) assertNoNativeBinaries(fullPath);
    else if (entry.name.endsWith(".node")) {
      throw new Error(`Native binaries must remain outside the Next archive: ${fullPath}`);
    }
  }
}

/** Consolidate read-only Next output for Electron's ASAR-aware Node runtime. */
export async function archiveElectronBuild(stagingRoot, distDir, createArchive) {
  const stage = path.resolve(stagingRoot);
  const nextDir = path.resolve(stage, distDir);
  if (!nextDir.startsWith(stage + path.sep) || !existsSync(nextDir)) {
    throw new Error(`Invalid staged Next directory: ${nextDir}`);
  }
  const serverPath = path.join(stage, "server.js");
  const server = readFileSync(serverPath, "utf8");
  const marker = "process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)";
  if (!server.includes(marker)) throw new Error("Standalone server config marker missing");
  assertNoNativeBinaries(nextDir);
  const archivePath = `${nextDir}.asar`;
  if (existsSync(archivePath)) throw new Error(`Archive already exists: ${archivePath}`);
  const archive = createArchive || requireElectron("@electron/asar").createPackage;
  await archive(nextDir, archivePath);
  if (!existsSync(archivePath)) throw new Error(`Archive was not created: ${archivePath}`);
  const archivedDist = `${distDir.replaceAll("\\", "/")}.asar`;
  writeFileSync(
    serverPath,
    server.replace(
      marker,
      `nextConfig.distDir = ${JSON.stringify(archivedDist)};\nnextConfig.experimental.isrFlushToDisk = false;\n${marker}`
    )
  );
  rmSync(nextDir, { recursive: true, force: true });
  // Next's tracing may pull in development fixtures or local scratch data.
  for (const unused of ["tests", "_artifacts"]) {
    rmSync(path.join(stage, unused), { recursive: true, force: true });
  }
  return archivePath;
}
