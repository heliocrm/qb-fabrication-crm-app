import { render } from "@react-email/render"
import { getResendClient, getResendFromAddress, isResendConfigured } from "@/lib/email/resend"
import { MaterialPullEmail } from "@/lib/email/templates/material-pull"

export async function sendMaterialPullEmail(input: {
  to: string
  fullName: string
  title: string
  body: string
  urlPath: string
}): Promise<boolean> {
  if (!isResendConfigured()) return false

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  const link = `${siteUrl}${input.urlPath.startsWith("/") ? input.urlPath : `/${input.urlPath}`}`

  try {
    const html = await render(
      MaterialPullEmail({
        fullName: input.fullName,
        title: input.title,
        body: input.body,
        link,
      })
    )

    const resend = getResendClient()
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: input.to,
      subject: input.title,
      html,
    })

    if (error) {
      console.error("[material-pull email]", error)
      return false
    }
    return true
  } catch (err) {
    console.error("[material-pull email]", err)
    return false
  }
}
