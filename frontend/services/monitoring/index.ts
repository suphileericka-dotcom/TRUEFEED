// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
type MonitoringContext = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, context: MonitoringContext = {}) {
  if (__DEV__) {
    console.info(`[monitoring:event] ${name}`, context);
  }
}

export function trackError(error: unknown, context: MonitoringContext = {}) {
  if (__DEV__) {
    console.error('[monitoring:error]', error, context);
  }
}
