export type ServerTimingContext = Record<
  string,
  boolean | number | string | null | undefined
>;

export type ServerTimingMetric = {
  name: string;
  durationMs: number;
  description?: string;
};

type TimedResult<T> = {
  value: T;
  metric: ServerTimingMetric;
};

function roundDuration(durationMs: number) {
  return Math.round(durationMs * 10) / 10;
}

function logMetric(
  metric: ServerTimingMetric,
  context: ServerTimingContext,
  outcome: "ok" | "error",
  error?: unknown,
) {
  console.info(
    JSON.stringify({
      event: "server_timing",
      metric: metric.name,
      duration_ms: metric.durationMs,
      outcome,
      ...context,
      ...(error
        ? {
            error_type:
              error instanceof Error ? error.name : "UnknownError",
          }
        : {}),
    }),
  );
}

export async function measureServerTiming<T>(
  name: string,
  operation: () => Promise<T>,
  context: ServerTimingContext = {},
  description?: string,
): Promise<TimedResult<T>> {
  const startedAt = performance.now();
  try {
    const value = await operation();
    const metric = {
      name,
      durationMs: roundDuration(performance.now() - startedAt),
      description,
    };
    logMetric(metric, context, "ok");
    return { value, metric };
  } catch (error) {
    const metric = {
      name,
      durationMs: roundDuration(performance.now() - startedAt),
      description,
    };
    logMetric(metric, context, "error", error);
    throw error;
  }
}

export async function withServerTiming<T>(
  name: string,
  operation: () => Promise<T>,
  context: ServerTimingContext = {},
  description?: string,
) {
  const { value } = await measureServerTiming(
    name,
    operation,
    context,
    description,
  );
  return value;
}

function quoteDescription(description: string) {
  return description.replace(/["\\\r\n]/g, " ").trim();
}

export function formatServerTiming(metric: ServerTimingMetric) {
  const duration = metric.durationMs.toFixed(1);
  const description = metric.description
    ? `;desc="${quoteDescription(metric.description)}"`
    : "";
  return `${metric.name};dur=${duration}${description}`;
}
