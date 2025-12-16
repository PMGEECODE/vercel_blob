interface LogEntry {
  timestamp: string
  level: "info" | "warn" | "error" | "security"
  message: string
  context?: Record<string, any>
}

export class SecurityLogger {
  private static sanitizeForLog(data: any): any {
    if (typeof data !== "object" || data === null) {
      return data
    }

    const sanitized = { ...data }
    const sensitiveKeys = ["password", "token", "apiKey", "secret", "authorization"]

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = "[REDACTED]"
      }
    }

    return sanitized
  }

  static log(level: LogEntry["level"], message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.sanitizeForLog(context) : undefined,
    }

    // In production, send to monitoring service (Sentry, DataDog, etc.)
    console.log(JSON.stringify(entry))
  }

  static info(message: string, context?: Record<string, any>): void {
    this.log("info", message, context)
  }

  static warn(message: string, context?: Record<string, any>): void {
    this.log("warn", message, context)
  }

  static error(message: string, context?: Record<string, any>): void {
    this.log("error", message, context)
  }

  static security(message: string, context?: Record<string, any>): void {
    this.log("security", message, context)
  }
}
