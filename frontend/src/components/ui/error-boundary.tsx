import React from "react"
import { AlertTriangle, Copy, Home, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { t } from "@/i18n"

interface ErrorBoundaryProps {
    children: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class RouteNotFoundError extends Error {
    constructor() {
        super("ROUTE_NOT_FOUND")
        this.name = "RouteNotFoundError"
    }
}

function NotFoundScreen({ onGoHome }: { onGoHome: () => void }) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background px-6">
            <div className="flex w-full max-w-lg flex-col items-center text-center">
                <img
                    src="/beamfull-dark.png"
                    className="mb-8 h-12 w-auto opacity-80 dark:hidden"
                    alt="BEAM"
                />
                <img
                    src="/beamfull.png"
                    className="mb-8 hidden h-12 w-auto opacity-80 dark:block"
                    alt="BEAM"
                />

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                    <MapPin className="h-7 w-7" />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {t("errors.notFound.title")}
                </h1>

                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    {t("errors.notFound.description")}
                </p>

                <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5">
                    <span className="font-mono text-xs text-yellow-600 dark:text-yellow-400">
                        ERROR: ROUTE_NOT_FOUND
                    </span>
                </div>

                <Button
                    onClick={onGoHome}
                    className="mt-8 px-8"
                    size="lg"
                    variant="outline"
                >
                    <Home className="me-2 h-4 w-4" />
                    {t("errors.notFound.goHome")}
                </Button>
            </div>
        </div>
    )
}

function CrashScreen({
                         error,
                         onGoHome,
                         onCopy,
                     }: {
    error: Error | null
    onGoHome: () => void
    onCopy: () => void
}) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background px-6">
            <div className="flex w-full max-w-lg flex-col items-center text-center">
                <img
                    src="/beamfull-dark.png"
                    className="mb-8 h-12 w-auto opacity-80 dark:hidden"
                    alt="BEAM"
                />
                <img
                    src="/beamfull.png"
                    className="mb-8 hidden h-12 w-auto opacity-80 dark:block"
                    alt="BEAM"
                />

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-7 w-7" />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {t("errors.crash.title")}
                </h1>

                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    {t("errors.crash.description")}
                </p>

                <div className="mt-6 w-full overflow-hidden rounded-lg border border-destructive/20 bg-destructive/5 text-start">
                    <div className="flex items-center justify-between border-b border-destructive/20 bg-destructive/10 px-4 py-2">
                        <span className="font-mono text-xs font-semibold text-destructive">
                            {error?.name || "Error"}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCopy}
                            className="h-7 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive"
                        >
                            <Copy className="me-1.5 h-3 w-3" />
                            {t("errors.crash.copy")}
                        </Button>
                    </div>
                    <ScrollArea className="h-32 w-full p-4">
                        <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-destructive/80">
                            {error?.stack || error?.message || t("errors.unknown")}
                        </pre>
                    </ScrollArea>
                </div>

                <p className="mt-4 text-[11px] text-muted-foreground/60">
                    {t("errors.crash.hint")}
                </p>

                <Button
                    onClick={onGoHome}
                    className="mt-4 px-8"
                    size="lg"
                >
                    <Home className="me-2 h-4 w-4" />
                    {t("errors.crash.goHome")}
                </Button>
            </div>
        </div>
    )
}

class ErrorBoundaryInner extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        if (error.message.includes("Cannot read properties of undefined (reading 'main')")) {
            console.warn('[ErrorBoundary] Wails not available, ignoring error')
            return
        }

        if (error instanceof RouteNotFoundError || error.message === "ROUTE_NOT_FOUND") {
            return
        }

        console.error("BEAM App Render Error:", error, errorInfo)
    }

    componentDidMount() {
        window.addEventListener("error", this.handleGlobalError)
        window.addEventListener("unhandledrejection", this.handleGlobalRejection)
    }

    componentWillUnmount() {
        window.removeEventListener("error", this.handleGlobalError)
        window.removeEventListener("unhandledrejection", this.handleGlobalRejection)
    }

    handleGlobalError = (event: ErrorEvent) => {
        if (event.message.includes("Cannot read properties of undefined (reading 'main')")) {
            event.preventDefault()
            return
        }

        if (event.message.includes("ResizeObserver loop")) {
            event.preventDefault()
            return
        }

        event.preventDefault()
        this.setState({
            hasError: true,
            error: event.error || new Error(event.message),
        })
    }

    handleGlobalRejection = (event: PromiseRejectionEvent) => {
        event.preventDefault()
        this.setState({
            hasError: true,
            error:
                event.reason instanceof Error
                    ? event.reason
                    : new Error(String(event.reason)),
        })
    }

    handleCopy = () => {
        const text =
            this.state.error?.stack ||
            this.state.error?.message ||
            t("errors.unknown")
        navigator.clipboard.writeText(text)
    }

    handleReset = () => {
        window.location.href = "/"
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children
        }

        const is404 =
            this.state.error instanceof RouteNotFoundError ||
            this.state.error?.message === "ROUTE_NOT_FOUND"

        if (is404) {
            return <NotFoundScreen onGoHome={this.handleReset} />
        }

        return (
            <CrashScreen
                error={this.state.error}
                onGoHome={this.handleReset}
                onCopy={this.handleCopy}
            />
        )
    }
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
    return <ErrorBoundaryInner>{children}</ErrorBoundaryInner>
}
