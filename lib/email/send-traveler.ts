import { render } from "@react-email/render"
import { getResendClient, getResendFromAddress, isResendConfigured } from "@/lib/email/resend"
import { TravelerEmail } from "@/lib/email/templates/traveler"

export async function sendTravelerEmail(input: {
  to: string
  fullName: string
  jobNumber: string
  poNumber: string
  customer: string
  urlPath: string
}): Promise<boolean> {
  if (!isResendConfigured()) return false

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  const link = `${siteUrl}${input.urlPath.startsWith("/") ? input.urlPath : `/${input.urlPath}`}`
  const title = `Traveler TRV-${input.poNumber} · ${input.jobNumber}`

  try {
    const html = await render(
      TravelerEmail({
        fullName: input.fullName,
        title,
        body: `Digital traveler for ${input.customer} (PO ${input.poNumber}) on job ${input.jobNumber}. Open the link to view, print, or download.`,
        link,
      })
    )

    const resend = getResendClient()
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: input.to,
      subject: title,
      html,
    })

    if (error) {
      console.error("[traveler email]", error)
      return false
    }
    return true
  } catch (err) {
    console.error("[traveler email]", err)
    return false
  }
}
