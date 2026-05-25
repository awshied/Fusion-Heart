import { Request, Response, NextFunction } from "express";
import { logInfo, logError, logWarn, logHttp } from "../lib/logger";

export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  const originalSend = res.send;

  res.send = function (body: any): Response {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.url;
    const userId = (req as any).user?.userId || "anonymous";

    let logFunction = logInfo;
    if (statusCode >= 500) logFunction = logError;
    else if (statusCode >= 400) logFunction = logWarn;
    else if (method === "POST" || method === "PUT" || method === "DELETE")
      logFunction = logHttp;

    logFunction(
      `${method} ${url} - ${statusCode} - ${duration}ms - Pengguna: ${userId}`,
      {
        method,
        url,
        statusCode,
        duration,
        userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        responseBody:
          typeof body === "string" ? body.substring(0, 500) : "Binary data",
      },
    );

    return originalSend.call(this, body);
  };

  next();
};

export const logErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logError(`Error in ${req.method} ${req.url}`, {
    error: err.message,
    stack: err.stack,
    userId: (req as any).user?.userId,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  next(err);
};

export const logUserAction = (
  action: string,
  userId: string,
  details?: any,
) => {
  logInfo(`User Action: ${action}`, { userId, action, details });
};
