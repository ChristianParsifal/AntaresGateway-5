"use client";

import { APP_CONFIG } from "@/shared/constants/appConfig";
import { withBasePath } from "@/shared/utils/basePath";
import { cn } from "@/shared/utils/cn";

type OmniRouteLogoProps = { size?: number; className?: string };

export default function OmniRouteLogo({ size = 20, className }: OmniRouteLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local brand asset, no optimization request needed
    <img
      src={withBasePath("/antares-logo.png")}
      alt=""
      width={size}
      height={size}
      className={cn("antares-logo", className)}
    />
  );
}

interface OmniRouteLockupProps {
  name?: string | null;
  logoSrc?: string | null;
  className?: string;
}

export function OmniRouteLockup({ name, logoSrc, className }: OmniRouteLockupProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- operator-supplied white-label logo (data: or remote URL)
        <img src={logoSrc} alt="" className="size-8 shrink-0 object-contain" />
      ) : (
        <OmniRouteLogo size={32} />
      )}
      <span className="antares-wordmark truncate">{name || APP_CONFIG.name}</span>
    </span>
  );
}
