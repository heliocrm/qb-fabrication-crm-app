/**
 * Gmail integration — stub for future expansion.
 *
 * Planned capabilities:
 * - Send PO confirmation / delivery notification emails
 * - Log outbound mail to job activity feed
 *
 * Auth: service account cannot send as users without domain setup;
 *       prefer OAuth2 with gmail.send scope per user
 */
export class GoogleGmailService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_auth: unknown) {}

  /** @future Send templated email linked to a job */
  async sendJobNotification(_input: {
    to: string
    subject: string
    bodyHtml: string
  }): Promise<{ messageId: string }> {
    throw new Error("Gmail integration is not implemented yet.")
  }
}
