import { LogLevel } from '../types/enums.js';

const levelPriority: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.SILENT]: 99,
};

interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context?: Record<string, unknown>;
  readonly error?: Error;
}

type LogSink = (entry: LogEntry) => void;

class Logger {
  private level: LogLevel;
  private sinks: LogSink[];
  private defaultContext: Record<string, unknown>;

  constructor(
    level: LogLevel = LogLevel.INFO,
    sinks: LogSink[] = [],
    context: Record<string, unknown> = {},
  ) {
    this.level = level;
    this.sinks = sinks;
    this.defaultContext = context;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  addSink(sink: LogSink): void {
    this.sinks.push(sink);
  }

  child(context: Record<string, unknown>): Logger {
    return new Logger(this.level, this.sinks, { ...this.defaultContext, ...context });
  }

  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[this.level];
  }

  private emit(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
      error,
    };

    for (const sink of this.sinks) {
      try {
        sink(entry);
      } catch {
        // Sink errors must never crash the application
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.emit(LogLevel.ERROR, message, context, error);
  }
}

function consoleSink(entry: LogEntry): void {
  const ts = entry.timestamp;
  const lvl = entry.level.toUpperCase();
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  const err = entry.error ? `\n${entry.error.stack ?? entry.error.message}` : '';
  const line = `[${ts}] ${lvl}: ${entry.message}${ctx}${err}`;

  if (entry.level === LogLevel.ERROR) {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

let rootLogger: Logger | null = null;

export function createLogger(level: LogLevel = LogLevel.INFO): Logger {
  return new Logger(level, [consoleSink]);
}

export function getLogger(): Logger {
  if (!rootLogger) {
    rootLogger = createLogger();
  }
  return rootLogger;
}

export function initLogger(level: LogLevel): Logger {
  rootLogger = createLogger(level);
  return rootLogger;
}

export type { Logger, LogEntry, LogSink };
