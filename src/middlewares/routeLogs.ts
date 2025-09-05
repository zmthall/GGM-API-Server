// middlewares/routeLogger.ts
import type { Request, Response, NextFunction } from 'express';

type RouteLoggerOptions = {
  name?: string;                   // label in logs
  skip?: (req: Request) => boolean;
  level?: 'info' | 'debug' | 'warn';
};

export function routeLogger(opts: RouteLoggerOptions = {}) {
  const { name = 'http', skip, level = 'info' } = opts;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip?.(req)) return next();

    const log = req.log.child({ route: name });
    const start = process.hrtime.bigint();

    // one completion log when the response is sent
    res.on('finish', () => {
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      const contentLength = res.getHeader('content-length');

      log[level]({
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        userId: (req as any).user?.uid ?? null,
        params: req.params,
        // keep query + body safe/small
        query: req.query,
        contentLength: typeof contentLength === 'string' ? Number(contentLength) : contentLength ?? null,
      }, 'completed');
    });
    
    // Log aborted responses
    res.on('close', () => {
        if (!res.writableEnded) {
            log.warn({ statusCode: res.statusCode }, 'aborted');
        }
    });

    next();
  };
}
