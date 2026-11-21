import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { FaCheck, FaCode, FaCopy, FaDownload, FaImage, FaLink, FaQrcode, FaShare, FaStar } from "react-icons/fa6"
import { toast } from "sonner"

import { RevealInFolder } from "@wailsjs/go/handlers/SystemHandler"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import QrCode, { qrToPng } from "@/components/app/profiles/QrCode"
import { useProfiles } from "@/hooks/useProfiles"
import { cn } from "@/lib/utils"
import type { ExportedLink, ProfileSummary } from "@/types/api"
import { t } from "@/i18n"

interface ExportModalProps {
    profile: ProfileSummary | null
    onOpenChange: (open: boolean) => void
}

type ExportTab = "beam" | "raw" | "qr"

const EXPORT_METHODS = [
    { id: "beam" as const, icon: FaStar },
    { id: "raw" as const, icon: FaCode },
    { id: "qr" as const, icon: FaQrcode },
]

function safeFileName(name: string) {
    return name.replace(/[^\p{L}\p{N}_-]/gu, "_")
}

function toastSaved(path: string) {
    toast.success(t("profiles.exportModal.toast.fileSaved"), {
        description: path,
        action: {
            label: t("profiles.exportModal.toast.showInFolder"),
            onClick: () => {
                void RevealInFolder(path)
            },
        },
    })
}

export default function ExportModal({ profile, onOpenChange }: ExportModalProps) {
    const { exportRawLinks, saveProfileFile, saveLinksFile } = useProfiles()
    const [tab, setTab] = useState<ExportTab>("beam")
    const [name, setName] = useState("")
    const [sharing, setSharing] = useState(false)
    const openedAtRef = useRef(0)

    const [rawLinks, setRawLinks] = useState<ExportedLink[] | null>(null)
    const [rawLoading, setRawLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [qrKey, setQrKey] = useState<string>("sub")
    const [qrCopied, setQrCopied] = useState(false)
    const qrRef = useRef<SVGSVGElement>(null)

    const subscriptionUrl = profile?.url

    useEffect(() => {
        if (profile) {
            setName(profile.name || "Profile")
            setTab("beam")
            setRawLinks(null)
            setLinkCopied(false)
            setQrKey(profile.url ? "sub" : "0")
            setQrCopied(false)
            openedAtRef.current = Date.now()
        }
    }, [profile])

    useEffect(() => {
        // The QR tab offers single servers too, so it needs the links as well.
        if ((tab !== "raw" && tab !== "qr") || !profile || rawLinks !== null) return
        setRawLoading(true)
        exportRawLinks(profile.id)
            .then(setRawLinks)
            .finally(() => setRawLoading(false))
    }, [tab, profile])

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) onOpenChange(false)
    }

    const handleExport = async () => {
        if (!profile) return

        setSharing(true)

        try {
            const path = await saveProfileFile(
                profile.id,
                safeFileName(name || profile.name || "Profile")
            )

            if (!path) return

            toastSaved(path)
            onOpenChange(false)
        } finally {
            setSharing(false)
        }
    }

    const copyLink = (link: string, index: number) => {
        navigator.clipboard.writeText(link)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1200)
    }

    const copySubscriptionLink = () => {
        if (!subscriptionUrl) return
        navigator.clipboard.writeText(subscriptionUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 1200)
    }

    const copyAllLinks = () => {
        if (!rawLinks || rawLinks.length === 0) return
        navigator.clipboard.writeText(rawLinks.map((item) => item.link).join("\n"))
    }

    const saveAllLinks = async () => {
        if (!profile || !rawLinks || rawLinks.length === 0) return
        const path = await saveLinksFile(profile.id, safeFileName(profile.name || "Profile"))
        if (!path) return
        toastSaved(path)
    }

    /** What the QR tab can show: the subscription link first, then each server's own link. */
    const qrOptions = useMemo(() => {
        const options: { key: string; label: string; value: string }[] = []
        if (subscriptionUrl) options.push({ key: "sub", label: t("profiles.exportModal.qr.subscription"), value: subscriptionUrl })
        rawLinks?.forEach((item, i) => options.push({ key: String(i), label: item.name || t("profiles.exportModal.qr.server", { index: i + 1 }), value: item.link }))
        return options
    }, [subscriptionUrl, rawLinks])
    const qrOption = qrOptions.find((o) => o.key === qrKey) ?? qrOptions[0]

    const copyQrLink = () => {
        if (!qrOption) return
        navigator.clipboard.writeText(qrOption.value)
        toast.success(t("profiles.exportModal.toast.linkCopied"))
    }

    const copyQrImage = async () => {
        const svg = qrRef.current
        if (!svg) return
        try {
            const png = await qrToPng(svg)
            if (!png) throw new Error("no image")
            await navigator.clipboard.write([new ClipboardItem({ "image/png": png })])
            setQrCopied(true)
            setTimeout(() => setQrCopied(false), 1200)
        } catch {
            toast.error(t("profiles.exportModal.toast.imageCopyFailed"))
        }
    }

    return (
        <Dialog open={profile !== null} onOpenChange={handleOpenChange}>
            <DialogContent
                className="min-w-0 overflow-hidden max-w-sm p-5 pb-4"
                onInteractOutside={(event) => {
                    if (Date.now() - openedAtRef.current < 300) {
                        event.preventDefault()
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <FaShare className="h-4 w-4" />
                        {t("profiles.exportModal.title")}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-2">
                    {EXPORT_METHODS.map((m) => {
                        const Icon = m.icon
                        const isActive = tab === m.id
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setTab(m.id)}
                                className={cn(
                                    "rounded-lg border-2 p-3 text-center transition-all",
                                    isActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <Icon className={cn("mx-auto mb-1.5 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                <p className={cn("text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>{t(`profiles.exportModal.method.${m.id}.title`)}</p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground">{t(`profiles.exportModal.method.${m.id}.hint`)}</p>
                            </button>
                        )
                    })}
                </div>

                {subscriptionUrl && (
                    <button
                        type="button"
                        onClick={copySubscriptionLink}
                        className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-2 text-start transition-colors hover:bg-muted/50"
                        title={t("profiles.exportModal.copySubscription")}
                    >
                        <FaLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">
                            {subscriptionUrl}
                        </span>
                        {linkCopied ? (
                            <FaCheck className="h-3 w-3 shrink-0 text-green-500" />
                        ) : (
                            <FaCopy className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                    </button>
                )}

                {tab === "qr" ? (
                    <>
                        {!qrOption && rawLoading && (
                            <p className="py-6 text-center text-xs text-muted-foreground">{t("profiles.exportModal.loading")}</p>
                        )}
                        {!qrOption && !rawLoading && (
                            <p className="py-6 text-center text-xs leading-relaxed text-muted-foreground">
                                {t("profiles.exportModal.qr.nothing")}
                            </p>
                        )}
                        {qrOption && (
                            <div className="space-y-3">
                                <div className="relative mx-auto w-full max-w-[248px]">
                                    {/* A soft halo of the accent behind the white card. */}
                                    <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-primary/15 blur-2xl" />
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={qrOption.value}
                                            initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
                                            transition={{ duration: 0.18, ease: "easeOut" }}
                                            className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10"
                                        >
                                            <QrCode ref={qrRef} value={qrOption.value} className="block h-auto w-full" />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {qrOptions.length > 1 && (
                                    <Select value={qrOption.key} onValueChange={setQrKey}>
                                        <SelectTrigger size="sm" className="w-full text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {qrOptions.map((o) => (
                                                <SelectItem key={o.key} value={o.key} className="text-xs">
                                                    {o.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                                    {qrOption.key === "sub"
                                        ? t("profiles.exportModal.qr.hintSubscription")
                                        : t("profiles.exportModal.qr.hintServer")}
                                </p>
                            </div>
                        )}

                        <DialogFooter className="gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={copyQrLink} disabled={!qrOption}>
                                <FaLink className="h-3 w-3" />
                                {t("profiles.exportModal.qr.copyLink")}
                            </Button>
                            <Button size="sm" onClick={copyQrImage} disabled={!qrOption}>
                                {qrCopied ? <FaCheck className="h-3 w-3" /> : <FaImage className="h-3 w-3" />}
                                {qrCopied ? t("profiles.exportModal.qr.copied") : t("profiles.exportModal.qr.copyImage")}
                            </Button>
                        </DialogFooter>
                    </>
                ) : tab === "beam" ? (
                    <>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">{t("profiles.exportModal.beam.fileName")}</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Profile"
                                    className="h-9"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button onClick={handleExport} disabled={sharing || !profile} size="sm">
                                {sharing ? t("profiles.exportModal.beam.exporting") : t("profiles.exportModal.beam.download")}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        {rawLoading && (
                            <p className="py-6 text-center text-xs text-muted-foreground">{t("profiles.exportModal.loading")}</p>
                        )}
                        {!rawLoading && rawLinks !== null && rawLinks.length === 0 && (
                            <p className="py-6 text-center text-xs leading-relaxed text-muted-foreground">
                                {t("profiles.exportModal.raw.none")}
                            </p>
                        )}
                        {!rawLoading && rawLinks !== null && rawLinks.length > 0 && (
                            <ScrollArea className="h-56 rounded-md border">
                                <div className="divide-y">
                                    {rawLinks.map((item, i) => (
                                        <div key={i} className="space-y-1 px-2.5 py-2">
                                            <p className="truncate text-[11px] font-medium text-foreground/90">
                                                {item.name || t("profiles.exportModal.raw.untitled")}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    readOnly
                                                    value={item.link}
                                                    onFocus={(e) => e.currentTarget.select()}
                                                    className="h-7 min-w-0 flex-1 font-mono text-[10px]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => copyLink(item.link, i)}
                                                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    title={t("profiles.exportModal.raw.copy")}
                                                >
                                                    {copiedIndex === i ? (
                                                        <FaCheck className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <FaCopy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={saveAllLinks}
                                disabled={!rawLinks || rawLinks.length === 0}
                            >
                                <FaDownload className="h-3 w-3" />
                                .txt
                            </Button>
                            <Button size="sm" onClick={copyAllLinks} disabled={!rawLinks || rawLinks.length === 0}>
                                <FaCopy className="h-3 w-3" />
                                {t("profiles.exportModal.raw.copyAll")}
                            </Button>
                        </DialogFooter>
                    </>
                )}

            </DialogContent>
        </Dialog>
    )
}
