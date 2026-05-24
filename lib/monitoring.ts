/**
 * Production-Grade Monitoring & Telemetry Foundation
 * Memory Map Performance, Interaction, and Error Tracking Pipeline.
 * 
 * This module coordinates telemetry logging and acts as a central hub
 * for standard production integrations (Sentry, Vercel Analytics, PostHog, LogRocket).
 * All handlers are fully fail-safe (errors in telemetry never crash the application).
 */

type Severity = "info" | "warning" | "error" | "fatal"

interface MonitoringConfig {
    enableConsoleLogs: boolean
    enableSentry: boolean
    enableVercelAnalytics: boolean
    enablePostHog: boolean
    enableLogRocket: boolean
}

const CONFIG: MonitoringConfig = {
    enableConsoleLogs: process.env.NODE_ENV === "development",
    enableSentry: process.env.NEXT_PUBLIC_ENABLE_SENTRY === "true",
    enableVercelAnalytics: process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true",
    enablePostHog: process.env.NEXT_PUBLIC_ENABLE_POSTHOG === "true",
    enableLogRocket: process.env.NEXT_PUBLIC_ENABLE_LOGROCKET === "true",
}

// ── Integration Stubs (Ready for production binding) ───────────────────────
const SentryStub = {
    captureException: (error: any, context?: any) => {
        if (CONFIG.enableSentry) {
            // Sentry.captureException(error, { extra: context })
        }
    },
    captureMessage: (message: string, level: Severity, context?: any) => {
        if (CONFIG.enableSentry) {
            // Sentry.captureMessage(message, { level, extra: context })
        }
    }
}

const VercelAnalyticsStub = {
    track: (name: string, properties?: any) => {
        if (CONFIG.enableVercelAnalytics) {
            // va.track(name, properties)
        }
    }
}

const PostHogStub = {
    capture: (name: string, properties?: any) => {
        if (CONFIG.enablePostHog) {
            // posthog.capture(name, properties)
        }
    }
}

const LogRocketStub = {
    log: (message: string, context?: any) => {
        if (CONFIG.enableLogRocket) {
            // LogRocket.log(message, context)
        }
    },
    captureException: (error: any, context?: any) => {
        if (CONFIG.enableLogRocket) {
            // LogRocket.captureException(error, { extra: context })
        }
    }
}

// ── Console Log Helper (Styled for premium local debugging) ─────────────────
function devLog(type: "ERROR" | "API_ERROR" | "INTERACTION" | "PERFORMANCE", title: string, data: any) {
    if (!CONFIG.enableConsoleLogs) return
    const colors = {
        ERROR: "background: #FF3366; color: white; padding: 2px 6px; font-weight: bold; border-radius: 3px;",
        API_ERROR: "background: #FF6600; color: white; padding: 2px 6px; font-weight: bold; border-radius: 3px;",
        INTERACTION: "background: #00FFFF; color: black; padding: 2px 6px; font-weight: bold; border-radius: 3px;",
        PERFORMANCE: "background: #00FF00; color: black; padding: 2px 6px; font-weight: bold; border-radius: 3px;",
    }
    console.groupCollapsed(`%c[MONITOR] ${type}%c ${title}`, colors[type], "color: inherit; font-weight: normal;")
    console.log("Timestamp:", new Date().toISOString())
    console.log("Payload:", data)
    console.groupEnd()
}

/**
 * Captures any runtime exceptions or errors.
 * Safe to call anywhere on the server or client.
 */
export function captureError(error: Error | string | unknown, context?: any) {
    try {
        const err = error instanceof Error ? error : new Error(String(error))
        
        devLog("ERROR", err.message, { error: err, context })

        // Sentry
        SentryStub.captureException(err, context)
        
        // LogRocket
        LogRocketStub.captureException(err, context)
    } catch (telemetryErr) {
        console.error("Telemetry failed inside captureError:", telemetryErr)
    }
}

/**
 * Captures API failures with status codes, paths, and response descriptions.
 */
export function captureAPIError(url: string, status: number, statusText: string, context?: any) {
    try {
        const title = `API Error ${status}: ${url}`
        const payload = { url, status, statusText, ...context }

        devLog("API_ERROR", title, payload)

        // Sentry
        SentryStub.captureMessage(title, "error", payload)

        // PostHog / Vercel Analytics (track API errors as custom events)
        PostHogStub.capture("api_error", payload)
        VercelAnalyticsStub.track("api_error", payload)
    } catch (telemetryErr) {
        console.error("Telemetry failed inside captureAPIError:", telemetryErr)
    }
}

/**
 * Captures key deliberate user interactions (gacha rolls, claims, sticker additions).
 */
export function captureInteraction(name: string, metadata?: any) {
    try {
        devLog("INTERACTION", name, metadata)

        // Vercel Analytics & PostHog
        VercelAnalyticsStub.track(name, metadata)
        PostHogStub.capture(name, metadata)

        // LogRocket
        LogRocketStub.log(`Interaction: ${name}`, metadata)
    } catch (telemetryErr) {
        console.error("Telemetry failed inside captureInteraction:", telemetryErr)
    }
}

/**
 * Captures custom performance benchmarks and Core Web Vitals.
 */
export function capturePerformance(metricName: string, value: number, metadata?: any) {
    try {
        devLog("PERFORMANCE", `${metricName} -> ${value}ms`, { metricName, value, ...metadata })

        // Sentry Custom Transactions / Metrics
        SentryStub.captureMessage(`Performance Metric: ${metricName}`, "info", { metricName, value, ...metadata })

        // PostHog / Vercel Analytics custom properties
        PostHogStub.capture("performance_metric", { metricName, value, ...metadata })
    } catch (telemetryErr) {
        console.error("Telemetry failed inside capturePerformance:", telemetryErr)
    }
}
