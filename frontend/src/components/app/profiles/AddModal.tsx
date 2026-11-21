import { useCallback, useState, type MouseEvent } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    FaCheck,
    FaGlobe,
    FaPlus,
    FaStar,
    FaXmark,
} from "react-icons/fa6"
import { Input } from "@/components/ui/input"
import { LuFile, LuFileCheck } from "react-icons/lu"
import { useProfiles } from "@/hooks/useProfiles"
import { ImportFromBeam } from "@wailsjs/go/handlers/ProfileHandler"
import { cn } from "@/lib/utils"
import { t } from "@/i18n"

type Method = "url" | "beam"

interface AddModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const METHODS = [
    { id: "url" as const, icon: FaGlobe },
    { id: "beam" as const, icon: FaStar },
]

export default function AddModal({ open, onOpenChange }: AddModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [url, setUrl] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [method, setMethod] = useState<Method>("url")

    const { importUrl, load } = useProfiles()

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        if (rejectedFiles.length > 0) {
            setError(t("profiles.addModal.error.onlyBeam"))
            return
        }
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            setError(null)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false,
        // Системный диалог сразу показывает только .beam. MIME свой: у .beam его нет,
        // а octet-stream открыл бы фильтр для любых бинарников.
        accept: { "application/x-beam": [".beam"] },
        validator: (file) => {
            if (!file.name.toLowerCase().endsWith(".beam")) {
                return { code: "wrong-extension", message: t("profiles.addModal.error.onlyBeam") }
            }
            return null
        },
    })

    const removeFile = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        setFile(null)
    }

    const resetForm = () => {
        setFile(null)
        setUrl("")
        setError(null)
        setMethod("url")
    }

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen)
        if (!nextOpen) resetForm()
    }

    const handleImport = async () => {
        setLoading(true)
        setError(null)

        try {
            if (method === "beam" && file) {
                const buffer = await file.arrayBuffer()
                const data = Array.from(new Uint8Array(buffer))
                const result = await ImportFromBeam(data)

                if (!result.success) {
                    setError(result.error || t("profiles.addModal.error.importFailed"))
                    return
                }
            } else if (method === "url" && url) {
                const result = await importUrl(url)
                if (!result.success) {
                    setError(result.error || t("profiles.addModal.error.importFailed"))
                    return
                }
            } else {
                setError(t("profiles.addModal.error.fillFields"))
                return
            }

            onOpenChange(false)
            resetForm()
            await load()
        } finally {
            setLoading(false)
        }
    }

    const canSubmit = (
        (method === "beam" && file) ||
        (method === "url" && url.trim())
    ) && !loading

    const httpWarning = url.trim().toLowerCase().startsWith("http://")

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="p-5 pb-4 max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-base font-semibold">
                        <FaPlus className="w-4 h-4" />
                        {t("profiles.addModal.title")}
                    </div>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Method cards */}
                    <div className="grid grid-cols-2 gap-2">
                        {METHODS.map((m) => {
                            const Icon = m.icon
                            const isActive = method === m.id
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => { setMethod(m.id); setError(null) }}
                                    className={cn(
                                        "p-3 rounded-lg border-2 transition-all text-center",
                                        isActive
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 mx-auto mb-1.5", isActive ? "text-primary" : "text-muted-foreground")} />
                                    <p className={cn("text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>{t(`profiles.addModal.method.${m.id}.title`)}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{t(`profiles.addModal.method.${m.id}.hint`)}</p>
                                </button>
                            )
                        })}
                    </div>

                    {/* Form */}
                    {method === "url" && (
                        <div className="space-y-2">
                            <Input
                                placeholder={t("profiles.addModal.url.placeholder")}
                                value={url}
                                onChange={(e) => { setUrl(e.target.value); setError(null) }}
                                className="text-sm"
                                autoFocus
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t("profiles.addModal.url.hint")}
                            </p>
                            {httpWarning && (
                                <p className="text-[10px] text-amber-500">
                                    {t("profiles.addModal.url.insecure")}
                                </p>
                            )}
                        </div>
                    )}

                    {method === "beam" && (
                        <div className="space-y-2.5">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all",
                                    "flex items-center gap-3",
                                    isDragActive && "border-primary bg-primary/10",
                                    !isDragActive && !file && "border-border hover:border-primary/50",
                                    file && "border-green-500/50 bg-green-500/5"
                                )}
                            >
                                <input {...getInputProps()} />

                                {!file && !isDragActive && (
                                    <>
                                        <LuFile className="text-2xl text-muted-foreground" />
                                        <div>
                                            <p className="text-sm">{t("profiles.addModal.file.choose")}</p>
                                            <p className="text-xs text-muted-foreground">{t("profiles.addModal.file.orDrop")}</p>
                                        </div>
                                    </>
                                )}

                                {isDragActive && (
                                    <>
                                        <LuFile className="text-2xl text-primary animate-bounce" />
                                        <p className="text-sm text-primary">{t("profiles.addModal.file.dropHere")}</p>
                                    </>
                                )}

                                {file && !isDragActive && (
                                    <>
                                        <LuFileCheck className="text-2xl text-green-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <FaCheck className="w-2.5 h-2.5" />
                                                {file.name}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={removeFile} className="h-7 w-7 p-0">
                                            <FaXmark className="w-3 h-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-destructive text-xs">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleImport} disabled={!canSubmit} size="sm" className="w-full">
                        {loading ? t("profiles.addModal.submitting") : t("profiles.addModal.submit")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
