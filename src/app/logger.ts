type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatMessage(level: LogLevel, module: string, operation: string, message: string, context?: LogContext): string {
  const base = `[${level.toUpperCase()}] [${module}:${operation}] ${message}`;
  if (context && Object.keys(context).length > 0) {
    return `${base} ${JSON.stringify(context)}`;
  }
  return base;
}

function createModuleLogger(module: string) {
  return {
    debug(operation: string, message: string, context?: LogContext) {
      if (!shouldLog('debug')) return;
      console.debug(formatMessage('debug', module, operation, message, context));
    },
    info(operation: string, message: string, context?: LogContext) {
      if (!shouldLog('info')) return;
      console.info(formatMessage('info', module, operation, message, context));
    },
    warn(operation: string, message: string, context?: LogContext) {
      if (!shouldLog('warn')) return;
      console.warn(formatMessage('warn', module, operation, message, context));
    },
    error(operation: string, message: string, context?: LogContext) {
      if (!shouldLog('error')) return;
      console.error(formatMessage('error', module, operation, message, context));
    },
  };
}

export const logger = { create: createModuleLogger };
export type { LogLevel, LogContext };
