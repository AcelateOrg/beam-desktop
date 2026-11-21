import { RouteNotFoundError } from "@/components/ui/error-boundary"

export default function NotFound() {
    throw new RouteNotFoundError()
}