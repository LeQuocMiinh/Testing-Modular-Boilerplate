import { BaseLogger, pino } from 'pino';

let logger: BaseLogger;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
if (!logger) {
  const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info');

  logger = pino({
    level: LOG_LEVEL,
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
  });
}

export { logger };
