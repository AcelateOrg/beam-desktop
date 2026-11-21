import { FaFloppyDisk } from "react-icons/fa6"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { t } from "@/i18n"

interface UnsavedBarProps {
    saving?: boolean
    onSave: () => void
    onDiscard: () => void
}

export function UnsavedBar({ saving = false, onSave, onDiscard }: UnsavedBarProps) {
    return (
        <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-background via-background to-transparent p-3 pt-10 pointer-events-none">
            <Card className="py-0 gap-0 border-primary/20 bg-primary/5 p-3 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <FaFloppyDisk className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                        {t("common.unsaved.message")}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={onDiscard}
                            disabled={saving}
                        >
                            {t("common.action.cancel")}
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={onSave}
                            disabled={saving}
                        >
                            {saving ? t("common.action.saving") : t("common.action.save")}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
