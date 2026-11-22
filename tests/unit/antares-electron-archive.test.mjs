import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { archiveElectronBuild } from "../../scripts/build/archiveElectronBuild.mjs";

function fixture(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "antares-archive-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(path.join(dir, ".build", "next"), { recursive: true });
  mkdirSync(path.join(dir, "tests"));
  writeFileSync(path.join(dir, ".build", "next", "BUILD_ID"), "test");
  writeFileSync(
    path.join(dir, "server.js"),
    "process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)"
  );
  return dir;
}

test("archives the Next output and drops test fixtures after successful creation", async (t) => {
  const dir = fixture(t);
  const archive = await archiveElectronBuild(dir, ".build/next", async (_source, target) => {
    writeFileSync(target, "archive");
  });
  assert.equal(readFileSync(archive, "utf8"), "archive");
  assert.equal(existsSync(path.join(dir, ".build", "next")), false);
  assert.equal(existsSync(path.join(dir, "tests")), false);
  assert.match(
    readFileSync(path.join(dir, "server.js"), "utf8"),
    /nextConfig\.distDir = "\.build\/next\.asar"/
  );
  assert.match(readFileSync(path.join(dir, "server.js"), "utf8"), /isrFlushToDisk = false/);
});

test("keeps original output when archive creation fails", async (t) => {
  const dir = fixture(t);
  await assert.rejects(
    archiveElectronBuild(dir, ".build/next", async () => {
      throw new Error("archive failure");
    }),
    /archive failure/
  );
  assert.equal(existsSync(path.join(dir, ".build", "next", "BUILD_ID")), true);
  assert.equal(existsSync(path.join(dir, "tests")), true);
});

test("rejects native modules and paths outside staging", async (t) => {
  const dir = fixture(t);
  writeFileSync(path.join(dir, ".build", "next", "native.node"), "native");
  await assert.rejects(archiveElectronBuild(dir, ".build/next"), /Native binaries/);
  await assert.rejects(archiveElectronBuild(dir, "../outside"), /Invalid staged Next directory/);
});
