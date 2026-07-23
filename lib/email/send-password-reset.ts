import { getResendClient, getResendFromAddress } from "@/lib/email/resend"
import {
  PasswordResetEmail,
  type PasswordResetEmailProps,
} from "@/lib/email/templates/password-reset"

export async function sendPasswordResetEmail(
  props: PasswordResetEmailProps & { to: string }
) {
  const resend = getResendClient()
  const { to, ...templateProps } = props

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: [to],
    subject: `Reset your password for ${props.organizationName}`,
    react: PasswordResetEmail(templateProps),
  })

  if (error) {
    const msg = error.message ?? "Failed to send password reset email"
    if (msg.includes("not authorized to send emails") || msg.includes("not verified")) {
      throw new Error(
        "Email domain not verified in Resend. Use an address on your verified domain (e.g. invites@updates.qbfab.com)."
      )
    }
    throw new Error(msg)
  }
}
