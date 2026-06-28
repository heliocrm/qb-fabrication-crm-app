/**
 * Google Calendar integration — stub for future expansion.
 *
 * Planned capabilities:
 * - Create delivery / QC inspection events from job dates
 * - Sync shop floor schedule with shared team calendar
 *
 * Auth: reuse createGoogleAuth() with GOOGLE_SCOPES.calendar
 *       OAuth2 per-user for personal calendar writes
 */
export class GoogleCalendarService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_auth: unknown) {}

  /** @future Create a calendar event for job delivery */
  async createDeliveryEvent(_input: {
    jobNumber: string
    deliveryDate: string
    customerName: string
  }): Promise<{ eventId: string }> {
    throw new Error("Google Calendar integration is not implemented yet.")
  }
}
