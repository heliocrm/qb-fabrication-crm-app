import { GoogleServiceError } from "./types"

/**
 * Base class for Google Workspace product services.
 * Subclass for Drive, Calendar, Gmail — each gets its own scopes + API client.
 */
export abstract class GoogleWorkspaceService {
  protected auth: InstanceType<typeof import("googleapis").google.auth.GoogleAuth>

  constructor(auth: InstanceType<typeof import("googleapis").google.auth.GoogleAuth>) {
    this.auth = auth
  }

  protected wrapError(err: unknown, context: string): GoogleServiceError {
    if (err instanceof GoogleServiceError) return err

    const gaxios = err as {
      message?: string
      code?: string
      response?: { status?: number; data?: { error?: { message?: string } } }
    }

    const message =
      gaxios.response?.data?.error?.message ??
      gaxios.message ??
      `Google API error: ${context}`

    return new GoogleServiceError(
      message,
      gaxios.code,
      gaxios.response?.status
    )
  }
}
