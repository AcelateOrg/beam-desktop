import { Button } from "@/components/ui/button";
import { FaArrowsRotate } from "react-icons/fa6";

export default function RefreshButton() {
    return (
        <Button
            variant="ghost"
            className="rounded-s-xl rounded-e-none h-full px-4 bg-accent/30 hover:bg-accent/50"
        >
            <FaArrowsRotate className="w-3.5 h-3.5" />
        </Button>
    )
}