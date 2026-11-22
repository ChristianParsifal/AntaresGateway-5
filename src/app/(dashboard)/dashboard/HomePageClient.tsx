"use client";

import { useTranslations } from "next-intl";

import { useState, useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@omniroute/ui-kit/page-header";
import { WorkflowGuide } from "@omniroute/ui-kit/workflow-guide";
import Icon from "@/shared/components/Icon";
import { Spinner } from "@/shared/components/Loading";
import { CardSkeleton, Button, GuardedAction } from "@/shared/components";
import { useNotificationStore } from "@/store/notificationStore";
import { extractApiErrorMessage } from "@/shared/http/apiErrorMessage";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { useIsElectron, useOpenExternal } from "@/shared/hooks/useElectron";
import HomeUsageOverview from "../home/HomeUsageOverview";
import { shouldShowProviderTopologyOnHome } from "./homeAppearance";
import ManualUpdateCommand from "./ManualUpdateCommand";
import UpdateProgressDialog, { type UpdatePhase, type UpdateStep } from "./UpdateProgressDialog";

type VersionInfo = {
  current: string;
  latest: string;
  updateAvailable: boolean;
  channel: string;
  autoUpdateSupported: boolean;
  autoUpdateError?: string | null;
  manualUpdateCommand?: string | null;
};

type HomePageClientProps = {
  machineId?: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mergeUpdateStep(steps: UpdateStep[], nextStep: UpdateStep) {
  const idx = steps.findIndex((step) => step.step === nextStep.step);
  if (idx === -1) {
    return [...steps, nextStep];
  }

  const next = [...steps];
  next[idx] = nextStep;
  return next;
}

// Quick-start link classes, extracted so each <Link> still fits on one line with
// prefetch={false} (#8281) — this file is size-frozen.
const INLINE_LINK = "text-primary hover:underline";
// The kit WorkflowGuide numbers its steps itself; the step titles carry a "1. " prefix.
const stripStepNumber = (title: string) => title.replace(/^\s*\d+[.)]\s*/, "");
const DOCS_LINK =
  "hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text-muted hover:text-text-main hover:bg-bg-subtle transition-colors";

// Stable no-op subscription for useSyncExternalStore reads of never-changing
// browser globals (location.origin does not change without a full navigation).
function emptySubscribe() {
  return () => {};
}

export default function HomePageClient({ machineId }: HomePageClientProps) {
  const router = useRouter();
  const isElectron = useIsElectron();
  const { openExternal } = useOpenExternal();
  const t = useTranslations("home");
  const tp = useTranslations("providers");
  const [providerConnections, setProviderConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  // useSyncExternalStore keeps SSR/hydration consistent ("/v1" on the server,
  // the real origin after hydration) without a setState-in-effect round-trip.
  const baseUrl = useSyncExternalStore(
    emptySubscribe,
    () => `${globalThis.location.origin}/v1`,
    () => "/v1"
  );
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [updating, setUpdating] = useState(false);

  // Platform detection and download links for Electron
  const platform =
    typeof globalThis.window === "undefined" ? undefined : globalThis.window.electronAPI?.platform;
  // Destructured to locals: `versionInfo?.current` in a dependency array trips
  // the lint heuristic that treats any `.current` access as a mutable ref read.
  const installedVersion = versionInfo?.current || "";
  const latestVersion = versionInfo?.latest || "";
  const electronDownload = useMemo(() => {
    const cleanLatest = latestVersion.replace(/^v/, "");
    if (platform === "darwin") {
      return {
        label: t("downloadDmg"),
        url: `https://github.com/cheaper-inference/OmniRoute/releases/download/v${cleanLatest}/OmniRoute-${cleanLatest}.dmg`,
        desc: t("downloadDmgDescription", { version: installedVersion }),
      };
    }
    if (platform === "win32") {
      return {
        label: t("downloadExe"),
        url: `https://github.com/cheaper-inference/OmniRoute/releases/download/v${cleanLatest}/OmniRoute.Setup.${cleanLatest}.exe`,
        desc: t("downloadExeDescription", { version: installedVersion }),
      };
    }
    if (platform === "linux") {
      return {
        label: t("downloadAppImage"),
        url: `https://github.com/cheaper-inference/OmniRoute/releases/download/v${cleanLatest}/OmniRoute-${cleanLatest}.AppImage`,
        desc: t("downloadAppImageDescription", { version: installedVersion }),
      };
    }
    return {
      label: t("downloadUpdate"),
      url: `https://github.com/cheaper-inference/OmniRoute/releases/tag/v${cleanLatest}`,
      desc: t("downloadUpdateDescription", { version: installedVersion }),
    };
  }, [platform, t, latestVersion, installedVersion]);

  // Electron internal auto-updater state and listeners
  const [electronUpdateStatus, setElectronUpdateStatus] = useState<{
    status:
      "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
    version?: string;
    percent?: number;
    message?: string;
  }>({ status: "idle" });

  useEffect(() => {
    if (!isElectron || typeof globalThis.window === "undefined" || !globalThis.window.electronAPI)
      return;

    // Trigger initial check silently on mount
    globalThis.window.electronAPI.checkForUpdates().catch((err: any) => {
      console.error("[Electron] Check for updates failed:", err);
    });

    const dispose = globalThis.window.electronAPI.onUpdateStatus((data: any) => {
      setElectronUpdateStatus({
        status: data.status,
        version: data.version,
        percent: data.percent,
        message: data.message,
      });
    });

    return dispose;
  }, [isElectron]);

  const [updateSteps, setUpdateSteps] = useState<UpdateStep[]>([]);
  const [updatePhase, setUpdatePhase] = useState<UpdatePhase>("idle");

  // Appearance settings for home page pinning
  const [showQuickStartOnHome, setShowQuickStartOnHome] = useState(true); // default on
  const [showProviderTopologyOnHome, setShowProviderTopologyOnHome] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, unknown> | null) => {
        if (data) {
          if (typeof data.showQuickStartOnHome === "boolean") {
            setShowQuickStartOnHome(data.showQuickStartOnHome);
          }
          setShowProviderTopologyOnHome(
            shouldShowProviderTopologyOnHome(data.showProviderTopologyOnHome)
          );
        }
      })
      .catch(() => {
        /* ignore — defaults stay */
      });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [provRes, versionRes] = await Promise.all([
        fetch("/api/providers"),
        fetch("/api/system/version"),
      ]);
      if (provRes.ok) {
        const provData = await provRes.json();
        setProviderConnections(provData.connections || []);
      }
      if (versionRes.ok) {
        const versionData = await versionRes.json();
        setVersionInfo(versionData);
      }
    } catch (e) {
      console.log("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // T07: Check for unhealthy API keys and show notification (once per session)
  const notifiedUnhealthyKeys = useRef<Set<string>>(new Set());
  useEffect(() => {
    const checkApiKeyHealth = () => {
      const newUnhealthyKeys = new Set<string>();
      const unhealthyProviderIds = new Set<string>();
      const unhealthyConnections: string[] = [];
      let firstUnhealthyProviderId: string | null = null;
      let hasWarning = false;

      for (const conn of providerConnections) {
        const health = conn.providerSpecificData?.apiKeyHealth as
          | Record<
              string,
              {
                status: "active" | "warning" | "invalid";
                failures: number;
                lastFailure: string | null;
              }
            >
          | undefined;
        if (!health) continue;

        // Defense-in-depth: skip stale extra_N health entries whose index
        // is out of range of the current extraApiKeys list.
        // The backend cleans this up on PATCH, but existing stale data from
        // before the fix or other code paths could still have orphan entries.
        const extras: string[] = conn.providerSpecificData?.extraApiKeys ?? [];
        const extraKeyCount = Array.isArray(extras) ? extras.length : 0;

        const unhealthyKeys = Object.entries(health).filter(([keyId, h]) => {
          if (h.status !== "invalid" && h.status !== "warning") return false;
          // extra_N entries: only flag if the index is still within bounds
          if (keyId.startsWith("extra_")) {
            const idx = Number.parseInt(keyId.slice(6), 10);
            if (Number.isNaN(idx) || idx >= extraKeyCount) return false;
          }
          return true;
        });

        if (unhealthyKeys.length > 0) {
          for (const [, h] of unhealthyKeys) {
            if (h.status === "warning") hasWarning = true;
            break;
          }
          for (const [keyId] of unhealthyKeys) {
            newUnhealthyKeys.add(`${conn.id}:${keyId}`);
          }
          firstUnhealthyProviderId ??= conn.provider;
          unhealthyConnections.push(conn.name || conn.id);
          unhealthyProviderIds.add(conn.provider);
        }
      }

      // Only notify for newly unhealthy keys (not already notified)
      const hasNewUnhealthy = Array.from(newUnhealthyKeys).some(
        (k) => !notifiedUnhealthyKeys.current.has(k)
      );
      if (hasNewUnhealthy) {
        const navigateTo =
          newUnhealthyKeys.size === 1 && firstUnhealthyProviderId
            ? `/dashboard/providers/${firstUnhealthyProviderId}`
            : `/dashboard/providers?search=${encodeURIComponent(Array.from(unhealthyProviderIds).join(" "))}`;

        const notificationType = hasWarning ? "warning" : "error";

        useNotificationStore.getState().addNotification({
          type: notificationType,
          message: tp(hasWarning ? "apiKeyWarningAlert" : "apiKeyInvalidAlert", {
            count: newUnhealthyKeys.size,
            connections: unhealthyConnections.join(", "),
          }),
          title: tp(hasWarning ? "apiKeyWarningAlertTitle" : "apiKeyInvalidAlertTitle"),
          duration: 10000,
          onClick: () => router.push(navigateTo),
        });
        // Mark all current unhealthy keys as notified
        newUnhealthyKeys.forEach((k) => notifiedUnhealthyKeys.current.add(k));
      }
    };

    if (providerConnections.length > 0) {
      checkApiKeyHealth();
    }
  }, [providerConnections, t, tp, router]);

  const pollBackgroundUpdate = useCallback(
    async ({
      channel,
      message,
      targetVersion,
    }: {
      channel: string;
      message: string;
      targetVersion: string;
    }) => {
      const notify = useNotificationStore.getState();
      const initialSteps =
        channel === "docker-compose"
          ? [
              {
                step: "install",
                status: "done",
                message: message || t("updateQueued", { version: targetVersion }),
              },
              {
                step: "rebuild",
                status: "running",
                message: t("updateDockerRebuilding"),
              },
              {
                step: "restart",
                status: "pending",
                message: t("updateWaitingRestart"),
              },
            ]
          : [
              {
                step: "install",
                status: "running",
                message: message || t("updateInstalling", { version: targetVersion }),
              },
              {
                step: "restart",
                status: "pending",
                message: t("updateWaitingRestart"),
              },
            ];

      setUpdateSteps(initialSteps);

      // Docker rebuilds and host-side image pulls (docker-trigger) take longer than npm.
      const maxAttempts = channel.startsWith("docker") ? 72 : 36;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await wait(5000);

        try {
          const versionRes = await fetch("/api/system/version", { cache: "no-store" });
          if (!versionRes.ok) {
            throw new Error(`Version check returned ${versionRes.status}`);
          }

          const latestInfo = await versionRes.json();
          setVersionInfo(latestInfo);

          if (latestInfo.current === targetVersion) {
            setUpdateSteps((prev) => {
              let next = prev.map((step) => {
                if (step.step === "install" || step.step === "rebuild" || step.step === "restart") {
                  return { ...step, status: "done" };
                }
                return step;
              });

              next = mergeUpdateStep(next, {
                step: "complete",
                status: "done",
                message: t("updateRunning", { version: targetVersion }),
              });

              return next;
            });
            setUpdating(false);
            setUpdatePhase("done");
            notify.success(t("updateCompleted", { version: targetVersion }));
            await fetchData();
            return;
          }

          setUpdateSteps((prev) => {
            let next = prev;
            if (channel === "docker-compose") {
              next = mergeUpdateStep(next, {
                step: "rebuild",
                status: "running",
                message: t("updateDockerStillRebuilding", { version: targetVersion }),
              });
            } else {
              next = mergeUpdateStep(next, {
                step: "install",
                status: "running",
                message: t("updateInstallingBackground", { version: targetVersion }),
              });
            }

            next = mergeUpdateStep(next, {
              step: "restart",
              status: "pending",
              message: t("updateWaitingVersion", { version: targetVersion }),
            });

            return next;
          });
        } catch {
          setUpdateSteps((prev) => {
            let next = prev;
            if (channel === "docker-compose") {
              next = mergeUpdateStep(next, {
                step: "rebuild",
                status: "running",
                message: t("updateDockerStillInProgress"),
              });
            } else {
              next = mergeUpdateStep(next, {
                step: "install",
                status: "running",
                message: t("updateInstallingBackground", { version: targetVersion }),
              });
            }

            next = mergeUpdateStep(next, {
              step: "restart",
              status: "running",
              message: t("updateRestarting"),
            });

            return next;
          });
        }
      }

      setUpdateSteps((prev) =>
        mergeUpdateStep(prev, {
          step: "error",
          status: "failed",
          message: t("updateTimeout", { version: targetVersion }),
        })
      );
      setUpdating(false);
      setUpdatePhase("failed");
      notify.error(t("updateTimedOut", { version: targetVersion }));
    },
    [fetchData, t]
  );

  const handleUpdate = async () => {
    const notify = useNotificationStore.getState();
    setUpdating(true);
    setUpdatePhase("running");
    setUpdateSteps([]);

    try {
      const res = await fetch("/api/system/version", { method: "POST" });

      // If response is JSON (error/already up to date)
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok || !data.success) {
          // #5991: the error envelope is `{ error: { code, message, correlation_id } }`.
          // Passing the raw object to notify.error() rendered it as a React child →
          // "Minified React error #31" crash ("Internal Server Error" screen), e.g. on
          // the 403 from the loopback-only /api/system/version. Extract the string.
          notify.error(extractApiErrorMessage(data, t("updateStartFailed")));
          setUpdating(false);
          setUpdatePhase("idle");
          return;
        }
        notify.success(data.message || t("updateStarted"));
        await pollBackgroundUpdate({
          channel: data.channel || "docker-compose",
          message: data.message || "",
          targetVersion: data.to || data.latest,
        });
        return;
      }

      // SSE stream — read progress events
      if (!res.body) {
        notify.error(t("noResponseStream"));
        setUpdating(false);
        setUpdatePhase("idle");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            setUpdateSteps((prev) => {
              return mergeUpdateStep(prev, event);
            });

            if (event.step === "complete") {
              setUpdatePhase("done");
              setUpdating(false);
              notify.success(event.message || t("updateComplete"));
            } else if (event.step === "error") {
              setUpdatePhase("failed");
              notify.error(event.message || t("updateFailed"));
              setUpdating(false);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch {
      setUpdatePhase("failed");
      setUpdateSteps((prev) => [
        ...prev,
        {
          step: "error",
          status: "failed",
          message: t("updateNetworkError"),
        },
      ]);
      setUpdating(false);
    }
  };

  // Auto-reload after successful update (service restarts, need new page)
  useEffect(() => {
    if (updatePhase !== "done") return;
    const timer = setTimeout(() => {
      globalThis.window.location.reload();
    }, 8000);
    return () => clearTimeout(timer);
  }, [updatePhase]);
  const showUpdateOverlay = updatePhase !== "idle";

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const currentEndpoint = baseUrl;

  return (
    <div className="flex flex-col gap-8">
      {/* Update progress: a kit dialog that cannot be dismissed while the update runs */}
      <UpdateProgressDialog
        phase={updatePhase}
        steps={updateSteps}
        onDismiss={() => {
          setUpdating(false);
          setUpdatePhase("idle");
          setUpdateSteps([]);
          if (updatePhase === "done") globalThis.window.location.reload();
        }}
        onRetry={handleUpdate}
      />

      {/* Update Notification Banner */}
      {versionInfo?.updateAvailable && !showUpdateOverlay && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/10 px-5 py-4 text-primary">
            <div className="flex min-h-[48px] items-center justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Icon
                  name={
                    isElectron && electronUpdateStatus.status === "downloading"
                      ? "downloading"
                      : "system_update_alt"
                  }
                  size={24}
                />
                <div>
                  <p className="font-semibold text-sm">
                    {t("updateAvailableTitle", {
                      version: versionInfo.latest,
                      desktop: isElectron ? ` ${t("desktopAppLabel")}` : "",
                    })}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isElectron ? (
                      <>
                        {electronUpdateStatus.status === "checking" && t("checkingForUpdates")}
                        {electronUpdateStatus.status === "available" &&
                          t("versionAvailableForDownload", { version: versionInfo.latest })}
                        {electronUpdateStatus.status === "downloading" &&
                          t("downloadingUpdate", { percent: electronUpdateStatus.percent || 0 })}
                        {electronUpdateStatus.status === "downloaded" && t("updateDownloaded")}
                        {electronUpdateStatus.status === "error" &&
                          t("autoUpdateFailed", {
                            reason: electronUpdateStatus.message || t("unknownUpdateError"),
                          })}
                        {(electronUpdateStatus.status === "idle" ||
                          electronUpdateStatus.status === "not-available") &&
                          t("versionAvailableDesktop", { version: versionInfo.latest })}
                      </>
                    ) : versionInfo.autoUpdateSupported ? (
                      t("updateAvailableDesc")
                    ) : (
                      versionInfo.autoUpdateError || t("manualUpdateRequired")
                    )}
                  </p>
                  {!isElectron &&
                    !versionInfo.autoUpdateSupported &&
                    versionInfo.manualUpdateCommand && (
                      <ManualUpdateCommand command={versionInfo.manualUpdateCommand} />
                    )}
                </div>
              </div>

              {isElectron ? (
                <div className="flex gap-2 shrink-0 ml-4">
                  {electronUpdateStatus.status === "available" && (
                    <Button
                      size="sm"
                      onClick={() => globalThis.window.electronAPI?.downloadUpdate()}
                    >
                      {t("downloadUpdate")}
                    </Button>
                  )}
                  {electronUpdateStatus.status === "downloading" && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20">
                      <Spinner size="sm" />
                      <span className="text-xs font-semibold">
                        {electronUpdateStatus.percent || 0}%
                      </span>
                    </div>
                  )}
                  {electronUpdateStatus.status === "downloaded" && (
                    <Button
                      size="sm"
                      onClick={() => globalThis.window.electronAPI?.installUpdate()}
                      className="animate-pulse"
                    >
                      {t("restartAndInstall")}
                    </Button>
                  )}
                  {(electronUpdateStatus.status === "error" ||
                    electronUpdateStatus.status === "idle" ||
                    electronUpdateStatus.status === "not-available") && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setElectronUpdateStatus({ status: "checking" });
                        globalThis.window.electronAPI?.checkForUpdates().catch((err: any) => {
                          setElectronUpdateStatus({ status: "error", message: err.message });
                        });
                      }}
                    >
                      {t("checkForUpdate")}
                    </Button>
                  )}
                </div>
              ) : (
                <GuardedAction
                  size="sm"
                  onClick={handleUpdate}
                  disabled={updating}
                  reason={
                    versionInfo.autoUpdateSupported
                      ? undefined
                      : versionInfo.autoUpdateError || t("manualUpdateRequired")
                  }
                  className="ml-4 shrink-0 font-semibold"
                >
                  {versionInfo.autoUpdateSupported ? t("updateNow") : t("manualUpdate")}
                </GuardedAction>
              )}
            </div>

            {/* Direct download fallback links shown if in Electron and auto-updater has failed, is idle, or has completed check */}
            {isElectron &&
              (electronUpdateStatus.status === "error" ||
                electronUpdateStatus.status === "idle" ||
                electronUpdateStatus.status === "available" ||
                electronUpdateStatus.status === "not-available") && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-primary/20 mt-2 pt-3 gap-2">
                  <p className="text-xs opacity-75">{t("directDownloadHint")}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        openExternal(
                          `https://github.com/cheaper-inference/OmniRoute/releases/tag/v${versionInfo.latest}`
                        )
                      }
                      className="text-xs py-1"
                    >
                      {t("releaseNotes")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openExternal(electronDownload.url)}
                      className="text-xs py-1"
                    >
                      {electronDownload.label}
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Quick Start (controlled by Appearance setting, default on) */}
      {showQuickStartOnHome && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            title={t("quickStart")}
            description={t("quickStartDesc")}
            actions={
              <Link href="/docs" prefetch={false} className={DOCS_LINK}>
                <Icon name="menu_book" size={14} />
                {t("fullDocs")}
              </Link>
            }
          />
          <WorkflowGuide
            label={t("quickStart")}
            items={[
              {
                id: "step1",
                icon: <Icon name="key" size={18} />,
                title: stripStepNumber(t("step1Title")),
                description: (
                  <>
                    {t.rich("step1Desc", {
                      endpoint: (chunks) => (
                        <Link
                          href="/dashboard/api-manager"
                          prefetch={false}
                          className={INLINE_LINK}
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </>
                ),
              },
              {
                id: "step2",
                icon: <Icon name="dns" size={18} />,
                title: stripStepNumber(t("step2Title")),
                description: (
                  <>
                    {t.rich("step2Desc", {
                      providers: (chunks) => (
                        <Link href="/dashboard/providers" prefetch={false} className={INLINE_LINK}>
                          {chunks}
                        </Link>
                      ),
                    })}
                  </>
                ),
              },
              {
                id: "step3",
                icon: <Icon name="link" size={18} />,
                title: stripStepNumber(t("step3Title")),
                description: <>{t("step3Desc", { url: currentEndpoint })}</>,
              },
              {
                id: "step4",
                icon: <Icon name="analytics" size={18} />,
                title: stripStepNumber(t("step4Title")),
                description: (
                  <>
                    {t.rich("step4Desc", {
                      logs: (chunks) => (
                        <Link href="/dashboard/logs" prefetch={false} className={INLINE_LINK}>
                          {chunks}
                        </Link>
                      ),
                      analytics: (chunks) => (
                        <Link href="/dashboard/analytics" prefetch={false} className={INLINE_LINK}>
                          {chunks}
                        </Link>
                      ),
                    })}
                  </>
                ),
              },
            ]}
          />
        </section>
      )}

      {showProviderTopologyOnHome && <HomeUsageOverview />}
    </div>
  );
}
