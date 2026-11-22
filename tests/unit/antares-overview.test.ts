import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOverview } from "../../src/app/(dashboard)/home/overviewData";
import { SIDEBAR_SECTIONS } from "../../src/shared/constants/sidebarVisibility/sections";

const now = new Date("2026-11-22T23:30:00Z");

test("overview aligns 53 weeks in UTC and preserves missing and future dates", () => {
  const { cells, trend, today } = buildOverview([], now);
  assert.equal(cells.length, 371);
  assert.equal(new Date(cells[0].date).getUTCDay(), 0);
  assert.equal(today, "2026-11-22");
  assert.equal(cells.filter((cell) => cell.future).length, 6);
  assert.ok(cells.every((cell) => cell.level === "missing"));
  assert.equal(trend.length, 14);
  assert.equal(trend.at(-1)?.requests, null);
});

test("daily requests and tokens combine providers with gaps after history begins", () => {
  const { cells, trend } = buildOverview(
    [
      { date: "2026-11-20", requests: 4, totalTokens: 100 },
      { date: "2026-11-20", requests: 16, totalTokens: 200 },
      { date: "2026-11-22", requests: 100, totalTokens: 400 },
    ],
    now
  );
  assert.equal(cells.find((cell) => cell.date === "2026-11-19")?.level, "missing");
  assert.equal(cells.find((cell) => cell.date === "2026-11-20")?.level, 3);
  assert.equal(cells.find((cell) => cell.date === "2026-11-21")?.level, 0);
  assert.equal(cells.find((cell) => cell.date === "2026-11-22")?.level, 4);
  assert.deepEqual(
    trend.slice(-3).map(({ requests, tokens }) => [requests, tokens]),
    [
      [20, 300],
      [0, 0],
      [100, 400],
    ]
  );
});

test("sidebar shows AntaresProxy and omits the issue link", () => {
  assert.equal(
    SIDEBAR_SECTIONS.find(({ id }) => id === "omni-proxy")?.titleFallback,
    "AntaresProxy"
  );
  const help = SIDEBAR_SECTIONS.find(({ id }) => id === "help");
  assert.ok(help?.children.some(({ id }) => id === "docs"));
  assert.ok(!help?.children.some(({ id }) => id === "issues"));
});
