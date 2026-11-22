import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("electron/package.json", "utf8"));
const main = readFileSync("electron/main.js", "utf8");

test("branded Windows builds include installer and portable targets", () => {
  assert.equal(config.build.productName, "AntaresGateway");
  assert.equal(config.version, JSON.parse(readFileSync("package.json", "utf8")).version);
  assert.equal(config.version, "5.1.0");
  assert.deepEqual(
    config.build.win.target.map((entry) => entry.target),
    ["nsis", "portable"]
  );
  assert.equal(config.build.publish, undefined);
  const appResources = config.build.extraResources.find((entry) => entry.to === "app");
  assert.ok(appResources.filter.includes("!electron/dist-electron{,/**/*}"));
  assert.ok(appResources.filter.includes("!electron/dist-electron-optimized{,/**/*}"));
});

test("branded app does not request upstream updates", () => {
  assert.doesNotMatch(main, /autoUpdater\.(checkForUpdates|downloadUpdate)\s*\(/);
  assert.match(main, /label: "Updates not configured",\s*enabled: false/);
});
