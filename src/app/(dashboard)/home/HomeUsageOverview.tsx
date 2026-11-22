"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useLocale } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Icon from "@/shared/components/Icon";
import { withBasePath } from "@/shared/utils/basePath";
import { buildOverview, dayKey, heatmapWindow, type UsageDay } from "./overviewData";

type ProviderDay = UsageDay & { provider: string; promptTokens: number; completionTokens: number };

export default function HomeUsageOverview() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const label = (chinese: string, english: string) => (zh ? chinese : english);
  const [rows, setRows] = useState<ProviderDay[] | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState("");
  const [hovered, setHovered] = useState("");
  const [metric, setMetric] = useState<"requests" | "tokens">("requests");
  const [now, setNow] = useState(() => new Date());
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      const date = new Date();
      const params = new URLSearchParams({
        startDate: new Date(heatmapWindow(date).start).toISOString(),
      });
      try {
        const response = await fetch(
          withBasePath(`/api/usage/requests-by-provider-date?${params}`),
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );
        if (!response.ok) throw new Error("Usage request failed");
        const data: { rows: ProviderDay[] } = await response.json();
        if (controller.signal.aborted) return;
        setRows(data.rows);
        setNow(date);
        setError(false);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 60_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  const { cells, trend, first, today } = useMemo(() => buildOverview(rows ?? [], now), [rows, now]);
  const start = cells[0].date;
  const { totals, ranking } = useMemo(() => {
    const totals = { requests: 0, input: 0, output: 0, tokens: 0 };
    const providers = new Map<string, number>();
    for (const row of rows ?? []) {
      if (row.date < start || row.date > today) continue;
      totals.requests += row.requests;
      totals.input += row.promptTokens;
      totals.output += row.completionTokens;
      totals.tokens += row.totalTokens;
      providers.set(row.provider, (providers.get(row.provider) ?? 0) + row.requests);
    }
    return { totals, ranking: [...providers].sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }, [rows, start, today]);
  const selected = cells.find((cell) => cell.date === (hovered || active));
  const status = error
    ? rows
      ? label("刷新失败，正在显示上次统计", "Refresh failed. Showing previous data.")
      : label("请求统计加载失败", "Could not load usage data")
    : rows
      ? first
        ? label(
            `可用日汇总始于 ${first} · 方向键浏览日期`,
            `History starts ${first} · Use arrow keys to browse`
          )
        : label("暂无可用的请求日汇总", "No daily request history yet")
      : label("正在加载请求数据…", "Loading request history…");
  const cellLabel = (date: string, count: number | null) =>
    `${date} · ${count === null ? label("无日汇总", "No history") : label(`${number.format(count)} 次请求`, `${number.format(count)} requests`)}`;

  function moveCell(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const shift = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (!shift) return;
    event.preventDefault();
    const next = event.currentTarget.parentElement?.children[index + shift];
    if (next instanceof HTMLButtonElement) next.focus();
  }

  const metrics = [
    [label("请求次数", "Requests"), totals.requests, "monitoring"],
    [label("输入 Token", "Input tokens"), totals.input, "input"],
    [label("输出 Token", "Output tokens"), totals.output, "output"],
    [label("总 Token", "Total tokens"), totals.tokens, "token"],
  ] as const;
  const seriesLabel =
    metric === "requests" ? label("请求次数", "Requests") : label("总 Token", "Total tokens");

  return (
    <section aria-labelledby="antares-overview-title" className="antares-overview">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="antares-overview-title" className="text-lg font-semibold">
          {label("总览", "Overview")}
        </h2>
        <span className="text-xs text-text-muted">
          {start} — {today} (UTC)
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(([name, value, icon]) => (
          <article key={name} className="antares-overview-panel antares-glass-card">
            <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
              {name}
              <Icon name={icon} size={17} className="text-primary" />
            </div>
            <strong className="mt-2 block break-all text-2xl tabular-nums">
              {rows ? number.format(value) : "—"}
            </strong>
          </article>
        ))}
      </div>
      <article className="antares-overview-panel antares-glass-card">
        <h3>{label("请求频率", "Request activity")}</h3>
        <div className="antares-heat-scroll" onPointerLeave={() => setHovered("")}>
          <div
            className="antares-heat-grid"
            role="group"
            aria-label={label("按天统计的请求热力图", "Daily request heatmap")}
          >
            {cells.map(({ date, count, level, future }, index) =>
              future ? (
                <span key={date} aria-hidden="true" />
              ) : (
                <button
                  key={date}
                  type="button"
                  className="antares-heat-cell"
                  data-level={level}
                  tabIndex={date === (active || today) ? 0 : -1}
                  aria-label={cellLabel(date, count)}
                  title={cellLabel(date, count)}
                  onPointerEnter={() => setHovered(date)}
                  onFocus={() => setActive(date)}
                  onClick={() => setActive(date)}
                  onKeyDown={(event) => moveCell(event, index)}
                />
              )
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
          <span aria-live="polite">
            {selected ? cellLabel(selected.date, selected.count) : status}
          </span>
          <div className="ms-auto flex items-center gap-1" aria-hidden="true">
            {label("少", "Less")}
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className="antares-heat-cell size-[11px]" data-level={level} />
            ))}
            {label("多", "More")}
          </div>
        </div>
      </article>
      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr]">
        <article className="antares-overview-panel antares-glass-card">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h3>{label("用量趋势", "Usage trend")}</h3>
              <p className="text-xs text-text-muted">
                {label("最近 14 天 · 按日汇总", "Last 14 days · Daily totals")}
              </p>
            </div>
            <div
              className="antares-trend-toggle"
              role="group"
              aria-label={label("统计指标", "Trend metric")}
            >
              <button
                type="button"
                aria-pressed={metric === "requests"}
                onClick={() => setMetric("requests")}
              >
                {label("请求", "Requests")}
              </button>
              <button
                type="button"
                aria-pressed={metric === "tokens"}
                onClick={() => setMetric("tokens")}
              >
                Token
              </button>
            </div>
          </div>
          <div className="mt-4 h-52 min-w-0">
            {trend.some((day) => day[metric] !== null) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend}
                  margin={{ top: 8, right: 15, bottom: 2, left: 2 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--ci-color-border-subtle)"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date: string) => date.slice(5)}
                    minTickGap={20}
                    tick={{ fill: "var(--ci-color-text-muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    width={55}
                    tick={{ fill: "var(--ci-color-text-muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tickFormatter={(value: number) =>
                      Intl.NumberFormat(locale, { notation: "compact" }).format(value)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--ci-color-surface)",
                      borderColor: "var(--ci-color-border)",
                      borderRadius: 10,
                    }}
                    itemStyle={{ color: "var(--ci-color-foreground)" }}
                    formatter={(value) =>
                      typeof value === "number" ? number.format(value) : value
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    name={seriesLabel}
                    stroke="var(--ci-color-accent-ink)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="antares-overview-empty">
                {rows && !error
                  ? label(
                      "首个请求完成后，用量趋势将在这里呈现",
                      "The trend appears after your first request"
                    )
                  : status}
              </p>
            )}
          </div>
        </article>
        <article className="antares-overview-panel antares-glass-card">
          <h3>{label("供应商使用排行", "Provider usage ranking")}</h3>
          {ranking.length ? (
            <ol className="mt-4 grid gap-3">
              {ranking.map(([provider, count]) => (
                <li key={provider}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate" title={provider}>
                      {provider || "—"}
                    </span>
                    <strong className="tabular-nums">{number.format(count)}</strong>
                  </div>
                  <div className="antares-rank-track" aria-hidden="true">
                    <div style={{ width: `${(count / ranking[0][1]) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="antares-overview-empty mt-4 min-h-32">{status}</p>
          )}
        </article>
      </div>
    </section>
  );
}
