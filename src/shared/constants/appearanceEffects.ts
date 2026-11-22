export const GLASS_BLUR = { min: 0, max: 32, default: 16 };
export const GLASS_TRANSPARENCY = { min: 0, max: 100, default: 38 };
export const THEME_HEX_PATTERN = "^#[0-9a-fA-F]{6}$";

export interface AppearanceEffects {
  blur: number;
  transparency: number;
  accent: string | null;
  motion: boolean;
}

export function normalizeAppearanceEffects(value: unknown): AppearanceEffects {
  const saved = (value ?? {}) as Partial<AppearanceEffects>;
  const slider = (value: unknown, range: typeof GLASS_BLUR) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.round(Math.max(range.min, Math.min(range.max, value)))
      : range.default;
  return {
    blur: slider(saved.blur, GLASS_BLUR),
    transparency: slider(saved.transparency, GLASS_TRANSPARENCY),
    accent:
      typeof saved.accent === "string" && new RegExp(THEME_HEX_PATTERN).test(saved.accent)
        ? saved.accent.toLowerCase()
        : null,
    motion: saved.motion !== false,
  };
}

export function applyAppearanceEffects(root: HTMLElement, effects: AppearanceEffects) {
  root.style.setProperty("--antares-card-blur", `${effects.blur}px`);
  root.style.setProperty("--antares-card-opacity", `${100 - effects.transparency}%`);
  if (effects.accent) root.style.setProperty("--antares-custom-accent", effects.accent);
  else root.style.removeProperty("--antares-custom-accent");
  root.toggleAttribute("data-antares-custom-accent", effects.accent !== null);
  root.toggleAttribute("data-antares-still", !effects.motion);
}
