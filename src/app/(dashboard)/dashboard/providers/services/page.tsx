"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@omniroute/ui-kit/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@omniroute/ui-kit/tabs";
import { brandTintVars } from "@omniroute/ui-kit/brand-tint";
import { FOUNDING_FRIEND_COLOR, isFoundingFriendServiceId } from "../featuredProviders";
import Icon from "@/shared/components/Icon";
import { CliproxyServiceTab } from "./tabs/CliproxyServiceTab";
import { NinerouterServiceTab } from "./tabs/NinerouterServiceTab";
import { MuxServiceTab } from "./tabs/MuxServiceTab";
import { BifrostServiceTab } from "./tabs/BifrostServiceTab";
import { DarioServiceTab } from "./tabs/DarioServiceTab";
import { OpenwaServiceTab } from "./tabs/OpenwaServiceTab";
import { LlmlinguaServiceTab } from "./tabs/LlmlinguaServiceTab";
import { OpencodeServerServiceTab } from "./tabs/OpencodeServerServiceTab";
import { SingboxServiceTab } from "./tabs/SingboxServiceTab";

type Tab =
  | "cliproxy"
  | "9router"
  | "mux"
  | "bifrost"
  | "dario"
  | "openwa"
  | "llmlingua"
  | "opencode-server"
  | "singbox";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "cliproxy", label: "CLIProxyAPI", icon: "swap_horiz" },
  { id: "9router", label: "9Router", icon: "route" },
  { id: "mux", label: "Mux", icon: "hub" },
  { id: "bifrost", label: "Bifrost", icon: "bolt" },
  { id: "dario", label: "Dario", icon: "shield_person" },
  { id: "openwa", label: "open-wa", icon: "chat" },
  { id: "llmlingua", label: "LLMLingua", icon: "compress" },
  { id: "opencode-server", label: "OpenCode Server", icon: "terminal" },
  { id: "singbox", label: "sing-box", icon: "vpn_lock" },
];

export default function ServicesPage() {
  const t = useTranslations("embeddedServices");
  const sp = useSearchParams();
  const router = useRouter();
  const active = (sp.get("tab") ?? "cliproxy") as Tab;

  function setTab(tab: Tab) {
    router.push(`/dashboard/providers/services?tab=${tab}`);
  }

  const panels: Record<Tab, React.ReactNode> = {
    cliproxy: <CliproxyServiceTab />,
    "9router": <NinerouterServiceTab />,
    mux: <MuxServiceTab />,
    bifrost: <BifrostServiceTab />,
    dario: <DarioServiceTab />,
    openwa: <OpenwaServiceTab />,
    llmlingua: <LlmlinguaServiceTab />,
    "opencode-server": <OpencodeServerServiceTab />,
    singbox: <SingboxServiceTab />,
  };

  return (
    <div className="space-y-6">
      <PageHeader compact title={t("title")} description={t("description")} />

      <Tabs variant="underline" value={active} onValueChange={(next) => setTab(next as Tab)}>
        <TabsList className="max-w-full overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <Icon name={tab.icon} size={16} />
              {tab.label}
              {isFoundingFriendServiceId(tab.id) && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--ci-brand-border)] bg-[var(--ci-brand-tint)] px-1.5 text-[10px] font-semibold text-[var(--ci-brand-ink)]"
                  style={brandTintVars(FOUNDING_FRIEND_COLOR)}
                >
                  <Icon name="verified" size={10} />
                  {t("foundingFriendBadge")}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="pt-4">
            {panels[tab.id]}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
