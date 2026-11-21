import { useState } from "react"
import { FaPlus } from "react-icons/fa6"

import { Button } from "@/components/ui/button"
import AddModal from "@/components/app/profiles/AddModal"
import { t } from "@/i18n"

export default function AddButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                className="h-full rounded-s-none rounded-e-xl bg-accent/30 px-4 hover:bg-accent/50"
                onClick={() => setOpen(true)}
                title={t("profiles.add")}
            >
                <FaPlus className="w-12" />
            </Button>

            <AddModal open={open} onOpenChange={setOpen} />
        </>
    )
}
