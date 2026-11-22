import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FOUNDING_FRIEND_COLOR,
  getFeaturedProviderRank,
  isFoundingFriendServiceId,
  SPONSOR_BRAND_COLORS,
} from "@/app/(dashboard)/dashboard/providers/featuredProviders";
import { sortProviderEntriesFeaturedFirst } from "@/app/(dashboard)/dashboard/providers/providerPageUtils";

const entry = (providerId: string, name: string) => ({
  providerId,
  provider: { id: providerId, name },
  stats: { total: 0 },
  displayAuthType: "apikey" as const,
  toggleAuthType: "apikey" as const,
});

test("OpenAI and Anthropic product families receive the founding-friend blue and first rank", () => {
  for (const id of [
    "openai",
    "azure-openai",
    "chatgpt",
    "chatgpt-web",
    "chatgpt-web-codex",
    "codex",
    "codex-app-server",
    "codex-cloud",
    "codex-search",
    "anthropic",
    "claude",
    "claude-web",
  ]) {
    assert.equal(getFeaturedProviderRank(id), 1, id);
    assert.equal(SPONSOR_BRAND_COLORS[id], FOUNDING_FRIEND_COLOR, id);
  }
  assert.equal(FOUNDING_FRIEND_COLOR, "#1783FF");
});

test("Kimi variants and generic compatible providers receive no featured rank or accent", () => {
  for (const id of [
    "moonshot",
    "kimi",
    "kimi-coding",
    "kimi-coding-apikey",
    "kimi-web",
    "openrouter",
  ]) {
    assert.equal(getFeaturedProviderRank(id), null, id);
    assert.equal(SPONSOR_BRAND_COLORS[id], undefined, id);
  }
});

test("founding friends pin before Antares Server and unfeatured providers, alphabetically within rank", () => {
  const sorted = sortProviderEntriesFeaturedFirst([
    entry("openai", "OpenAI"),
    entry("cheaperinference", "Antares Server"),
    entry("anthropic", "Anthropic"),
    entry("moonshot", "Moonshot AI"),
  ]);
  assert.deepEqual(
    sorted.map((e) => e.providerId),
    ["anthropic", "openai", "cheaperinference", "moonshot"]
  );
  assert.equal(SPONSOR_BRAND_COLORS.cheaperinference, "#31f889");
});

test("only embedded services with dedicated Claude or Codex integrations receive the badge", () => {
  assert.equal(isFoundingFriendServiceId("dario"), true);
  assert.equal(isFoundingFriendServiceId("cliproxy"), true);
  assert.equal(isFoundingFriendServiceId("bifrost"), false);
});
