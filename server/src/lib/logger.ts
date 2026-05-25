import winston from "winston";
import path from "path";

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(logColors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = "";
    if (Object.keys(meta).length > 0) {
      const { stack, ...otherMeta } = meta;
      if (stack) {
        metaStr = `\n${stack}`;
        if (Object.keys(otherMeta).length > 0) {
          metaStr += `\n${JSON.stringify(otherMeta, null, 2)}`;
        }
      } else {
        metaStr = `\n${JSON.stringify(meta, null, 2)}`;
      }
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.json(),
);

const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

if (process.env.NODE_ENV === "production") {
  const fs = require("fs");
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }
}

if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  );

  logger.add(
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  );
}

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: any) => {
  if (error instanceof Error) {
    logger.error(message, { error: error.message, stack: error.stack });
  } else {
    logger.error(message, error);
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.url;
    const userId = req.user?.userId || "anonymous";

    const logData = {
      method,
      url,
      statusCode,
      duration,
      userId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    if (statusCode >= 500) {
      logger.error(
        `${method} ${url} - ${statusCode} - ${duration}ms - Pengguna: ${userId}`,
        logData,
      );
    } else if (statusCode >= 400) {
      logger.warn(
        `${method} ${url} - ${statusCode} - ${duration}ms - Pengguna: ${userId}`,
        logData,
      );
    } else {
      logger.info(
        `${method} ${url} - ${statusCode} - ${duration}ms - Pengguna: ${userId}`,
        logData,
      );
    }
  });

  next();
};

export const logDatabaseQuery = (
  query: string,
  params?: any,
  duration?: number,
) => {
  if (process.env.NODE_ENV === "development") {
    logger.debug(`Database Query: ${query}`, { params, duration });
  }
};

export const logPerformance = (
  operation: string,
  duration: number,
  meta?: any,
) => {
  if (duration > 1000) {
    logger.warn(
      `Operasi lambat: ${operation} memakan waktu ${duration}ms`,
      meta,
    );
  } else {
    logger.debug(`Operasi: ${operation} memakan waktu ${duration}ms`, meta);
  }
};

export default logger;
