"use client";

import { useLayoutEffect, useRef } from "react";

const LEVELS = [1, 2, 3] as const;

/** One moving surface per depth, measured relative to the scrollable navigation. */
export function SidebarSelection() {
  const layer = useRef<HTMLDivElement>(null);
  const targets = useRef<(HTMLElement | undefined)[]>([]);

  useLayoutEffect(() => {
    const surface = layer.current;
    const root = surface?.parentElement;
    if (!root || !surface) return;

    const blocks = Array.from(surface.children) as HTMLElement[];
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => {
      const bounds = surface.getBoundingClientRect();
      const measurements = LEVELS.map((level, index) => {
        const target = Array.from(
          root.querySelectorAll<HTMLElement>(`[data-nav-current="${level}"]`)
        ).find((item) => !item.closest("[inert]"));
        const block = blocks[index];
        const animations = block.getAnimations?.() ?? [];
        const changed = targets.current[index] !== target;
        return {
          target,
          block,
          animations,
          changed,
          next: target?.getBoundingClientRect(),
          previous: changed && !block.hidden ? block.getBoundingClientRect() : null,
        };
      });
      measurements.forEach(({ target, block, animations, changed, next, previous }, index) => {
        targets.current[index] = target;
        if (changed) animations.forEach((animation) => animation.cancel());
        block.hidden = !next?.width || !next.height;
        if (!next || block.hidden || (!changed && animations.length > 0)) return;
        Object.assign(block.style, {
          left: `${next.left - bounds.left}px`,
          top: `${next.top - bounds.top}px`,
          width: `${next.width}px`,
          height: `${next.height}px`,
        });
        if (!previous || reduced?.matches || root.dataset.navInput === "keyboard" || !block.animate)
          return;
        const x = previous.left - next.left;
        const y = previous.top - next.top;
        const scaleX = previous.width / next.width;
        const scaleY = previous.height / next.height;
        if (Math.abs(x) + Math.abs(y) < 0.5 && scaleX === 1 && scaleY === 1) return;
        const motion = block.animate(
          [
            { transform: `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})` },
            { transform: "translate(0, 0) scale(1, 1)" },
          ],
          {
            duration: 200,
            easing:
              getComputedStyle(root).getPropertyValue("--ci-ease-standard").trim() || "ease-in-out",
          }
        );
        motion.onfinish = update;
      });
    };

    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(root);
    root.addEventListener("transitionend", update);
    root.addEventListener("transitioncancel", update);
    return () => {
      observer?.disconnect();
      root.removeEventListener("transitionend", update);
      root.removeEventListener("transitioncancel", update);
    };
  });

  return (
    <div ref={layer} className="antares-nav-selection" aria-hidden="true">
      {LEVELS.map((level) => (
        <span key={level} data-nav-level={level} hidden />
      ))}
    </div>
  );
}
