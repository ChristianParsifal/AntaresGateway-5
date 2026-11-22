"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { GLASS_BLUR, GLASS_TRANSPARENCY } from "@/shared/constants/appearanceEffects";
import { Toggle } from "@/shared/components";
import useThemeStore from "@/store/themeStore";
import type { AppearancePalette } from "@/shared/constants/appearancePalette";

export default function AppearanceEffectsControls({
  palette,
  isDark,
}: {
  palette: AppearancePalette;
  isDark: boolean;
}) {
  const t = useTranslations("settings");
  const id = useId();
  const effects = useThemeStore((state) => state.effects);
  const setEffects = useThemeStore((state) => state.setEffects);
  const accent =
    effects.accent ?? (palette === "classic" ? "#d8ff00" : isDark ? "#8529c8" : "#8730c1");

  return (
    <div className="grid gap-5 border-t border-border pt-4">
      {(
        [
          ["blur", GLASS_BLUR, "cardBlur", "px"],
          ["transparency", GLASS_TRANSPARENCY, "cardTransparency", "%"],
        ] as const
      ).map(([key, range, label, unit]) => (
        <div key={key} className="grid gap-1">
          <div className="flex items-center justify-between gap-4">
            <label className="font-medium" htmlFor={`${id}-${key}`}>
              {t(label)}
            </label>
            <span aria-hidden="true" className="text-sm tabular-nums text-text-muted">
              {effects[key]}
              {unit}
            </span>
          </div>
          <input
            id={`${id}-${key}`}
            type="range"
            min={range.min}
            max={range.max}
            value={effects[key]}
            aria-valuetext={`${effects[key]}${unit}`}
            onChange={(event) => setEffects({ [key]: event.currentTarget.valueAsNumber })}
            className="antares-effects-slider h-7 w-full max-w-xl cursor-pointer"
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="font-medium" htmlFor={`${id}-accent`}>
          {t("customThemeColor")}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id={`${id}-accent`}
            type="color"
            value={accent}
            onChange={(event) => setEffects({ accent: event.currentTarget.value })}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface px-1"
          />
          <span className="font-mono text-sm text-text-muted">{accent.toUpperCase()}</span>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-primary-ink hover:underline disabled:text-text-muted disabled:no-underline"
            disabled={effects.accent === null}
            onClick={() => setEffects({ accent: null })}
          >
            {t("customThemeColorReset")}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium">{t("ambientMotion")}</span>
        <Toggle
          checked={effects.motion}
          onChange={() => setEffects({ motion: !effects.motion })}
          ariaLabel={t("ambientMotion")}
        />
      </div>
    </div>
  );
}
