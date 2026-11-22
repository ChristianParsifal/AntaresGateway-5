// Presentation only: pin the two product families within their dashboard groups.
// Compatible protocols alone do not make a third-party provider a Founding Friend.
// Retained for the standalone Kimi combo preset, not provider-card highlighting.
export const KIMI_BRAND_COLOR = "#1783FF";

export const FOUNDING_FRIEND_COLOR = "#1783FF";
export const CHEAPERINFERENCE_BRAND_COLOR = "#31f889";

const FOUNDING_FRIEND_PROVIDER_IDS: ReadonlySet<string> = new Set([
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
]);

export function isFoundingFriendProviderId(providerId: string | null | undefined): boolean {
  return typeof providerId === "string" && FOUNDING_FRIEND_PROVIDER_IDS.has(providerId);
}

// These embedded services offer dedicated Claude and/or Codex integrations.
export function isFoundingFriendServiceId(serviceId: string): boolean {
  return serviceId === "dario" || serviceId === "cliproxy";
}

export function isCheaperInferenceProviderId(providerId: string | null | undefined): boolean {
  return providerId === "cheaperinference";
}

export function getFeaturedProviderRank(providerId: string | null | undefined): number | null {
  if (isFoundingFriendProviderId(providerId)) return 1;
  return isCheaperInferenceProviderId(providerId) ? 2 : null;
}

export const FEATURED_PROVIDER_IDS: ReadonlySet<string> = new Set([
  ...FOUNDING_FRIEND_PROVIDER_IDS,
  "cheaperinference",
]);

export const SPONSOR_BRAND_COLORS: Readonly<Record<string, string>> = Object.freeze({
  ...Object.fromEntries([...FOUNDING_FRIEND_PROVIDER_IDS].map((id) => [id, FOUNDING_FRIEND_COLOR])),
  cheaperinference: CHEAPERINFERENCE_BRAND_COLOR,
});

export function isFeaturedProviderId(providerId: string | null | undefined): boolean {
  return getFeaturedProviderRank(providerId) !== null;
}

export const isSponsorProviderId = isFeaturedProviderId;
