const DAY = 86_400_000;

export type UsageDay = { date: string; requests: number; totalTokens: number };

export function heatmapWindow(now = new Date()) {
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const end = today + (6 - now.getUTCDay()) * DAY;
  return { today, start: end - (53 * 7 - 1) * DAY };
}

export const dayKey = (time: number) => new Date(time).toISOString().slice(0, 10);

export function buildOverview(rows: UsageDay[], now = new Date()) {
  const { today, start } = heatmapWindow(now);
  const daily = new Map<string, UsageDay>();
  for (const row of rows) {
    const previous = daily.get(row.date);
    daily.set(row.date, {
      date: row.date,
      requests: (previous?.requests ?? 0) + row.requests,
      totalTokens: (previous?.totalTokens ?? 0) + row.totalTokens,
    });
  }
  const first = Array.from(daily.keys()).sort()[0];
  const cells = Array.from({ length: 53 * 7 }, (_, index) => {
    const time = start + index * DAY;
    const date = dayKey(time);
    const future = time > today;
    const count = !future && first && date >= first ? (daily.get(date)?.requests ?? 0) : null;
    const level =
      count === null
        ? "missing"
        : count === 0
          ? 0
          : count < 5
            ? 1
            : count < 20
              ? 2
              : count < 100
                ? 3
                : 4;
    return { date, future, count, level };
  });
  const trend = cells
    .filter((cell) => !cell.future)
    .slice(-14)
    .map(({ date, count }) => ({
      date,
      requests: count,
      tokens: count === null ? null : (daily.get(date)?.totalTokens ?? 0),
    }));
  return { cells, trend, first, today: dayKey(today) };
}
