import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MaterialRequestForm } from "@/components/material-requests/material-request-form"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "New Material Request",
}

export default function NewMaterialRequestPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-xl mx-auto w-full">
      <Button variant="ghost" size="sm" render={<Link href="/material-requests" />}>
        <ArrowLeft className="size-4" />
        Back to requests
      </Button>
      <MaterialRequestForm redirectTo="/material-requests" />
    </div>
  )
}
