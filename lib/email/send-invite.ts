import { getResendClient, getResendFromAddress } from "@/lib/email/resend"
import { InviteEmail, type InviteEmailProps } from "@/lib/email/templates/invite"

export async function sendInviteEmail(props: InviteEmailProps & { to: string }) {
  const resend = getResendClient()
  const { to, ...templateProps } = props

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: [to],
    subject: `You're invited to join ${props.organizationName} on QB Fabrication`,
    react: InviteEmail(templateProps),
  })

  if (error) {
    const msg = error.message ?? "Failed to send invite email"
    if (msg.includes("not authorized to send emails")) {
      throw new Error(
        "Email domain not verified in Resend. Confirm qbfab.com is verified and RESEND_FROM_EMAIL matches."
      )
    }
    throw new Error(msg)
  }
}
