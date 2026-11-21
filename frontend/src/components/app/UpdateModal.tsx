import { FaDownload } from "react-icons/fa6"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useUpdate } from "@/hooks/useUpdate"
import { getPlatform } from "@/lib/platform"
import { t } from "@/i18n"

interface UpdateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function UpdateModal({ open, onOpenChange }: UpdateModalProps) {
    const { latestVersion, mandatory, notes, status, progressPercent, download, apply } = useUpdate()

    const isLinux = getPlatform() === 'linux'

    const changelogLines = notes.map((line) => line.trim()).filter(Boolean)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm p-4">
                <DialogHeader>
                    <DialogTitle className="text-base">
                        {t("layout.update.version", { version: latestVersion ?? "..." })}
                    </DialogTitle>
                    {mandatory && (
                        <p className="text-xs font-medium text-amber-500">
                            {t("layout.update.mandatory")}
                        </p>
                    )}
                </DialogHeader>

                {status === "downloading" ? (
                    <div className="space-y-2 py-2">
                        <Progress value={progressPercent} className="h-2" />
                        <p className="text-center text-xs text-muted-foreground">
                            {progressPercent}%
                        </p>
                    </div>
                ) : changelogLines.length > 0 ? (
                    <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm text-muted-foreground">
                        {changelogLines.map((line, i) => (
                            <li key={i} className="flex gap-2">
                                <span className="text-primary">•</span>
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">{t("layout.update.noChangelog")}</p>
                )}

                <DialogFooter className="flex-col items-stretch gap-2 pt-2 sm:flex-col sm:items-stretch sm:space-x-0">
                    {status === "ready" ? (
                        <Button onClick={apply} size="sm">
                            {t("layout.update.installAndRestart")}
                        </Button>
                    ) : (
                        <Button onClick={download} disabled={status === "downloading"} size="sm">
                            <FaDownload className="h-3.5 w-3.5" />
                            {status === "downloading" ? t("layout.update.downloading") : t("layout.update.download")}
                        </Button>
                    )}

                    {isLinux && status === "ready" && (
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {t("layout.update.linuxTunNote")}
                        </p>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
