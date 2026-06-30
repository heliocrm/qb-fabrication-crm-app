import * as React from "react"
import { emailBrand } from "@/lib/email/brand"
import type { OrganizationRole } from "@/types"

const ROLE_LABELS: Record<OrganizationRole, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
}

export interface InviteEmailProps {
  fullName: string
  inviterName: string
  organizationName: string
  role: OrganizationRole
  inviteLink: string
}

export function InviteEmail({
  fullName,
  inviterName,
  organizationName,
  role,
  inviteLink,
}: InviteEmailProps) {
  const firstName = fullName.split(" ")[0] || fullName
  const roleLabel = ROLE_LABELS[role]

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Join ${organizationName}`}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: emailBrand.background,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          color: emailBrand.foreground,
          lineHeight: 1.5,
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: emailBrand.background, padding: "32px 16px" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 560,
                    backgroundColor: emailBrand.card,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: `1px solid ${emailBrand.border}`,
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: emailBrand.navy,
                          padding: "28px 32px",
                        }}
                      >
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td>
                                <div
                                  style={{
                                    display: "inline-block",
                                    width: 36,
                                    height: 36,
                                    backgroundColor: emailBrand.orange,
                                    borderRadius: 6,
                                    textAlign: "center",
                                    lineHeight: "36px",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    marginBottom: 12,
                                  }}
                                >
                                  QB
                                </div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    letterSpacing: "0.02em",
                                  }}
                                >
                                  QB Fabrication
                                </p>
                                <p
                                  style={{
                                    margin: "4px 0 0",
                                    fontSize: 13,
                                    color: "rgba(255,255,255,0.75)",
                                  }}
                                >
                                  Shop Management CRM
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Body */}
                    <tr>
                      <td style={{ padding: "32px" }}>
                        <p
                          style={{
                            margin: "0 0 16px",
                            fontSize: 16,
                            fontWeight: 600,
                            color: emailBrand.foreground,
                          }}
                        >
                          Hi {firstName},
                        </p>
                        <p style={{ margin: "0 0 20px", fontSize: 15, color: emailBrand.muted }}>
                          <strong style={{ color: emailBrand.foreground }}>{inviterName}</strong>{" "}
                          invited you to join{" "}
                          <strong style={{ color: emailBrand.foreground }}>
                            {organizationName}
                          </strong>{" "}
                          on the QB Fabrication CRM with the{" "}
                          <strong style={{ color: emailBrand.foreground }}>{roleLabel}</strong> role.
                        </p>
                        <p style={{ margin: "0 0 28px", fontSize: 15, color: emailBrand.muted }}>
                          Accept the invitation to set your password and access jobs, opportunities,
                          and shop workflows.
                        </p>

                        <table role="presentation" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  borderRadius: 6,
                                  backgroundColor: emailBrand.orange,
                                }}
                              >
                                <a
                                  href={inviteLink}
                                  style={{
                                    display: "inline-block",
                                    padding: "12px 28px",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#ffffff",
                                    textDecoration: "none",
                                  }}
                                >
                                  Accept invitation
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p
                          style={{
                            margin: "28px 0 0",
                            fontSize: 13,
                            color: emailBrand.muted,
                          }}
                        >
                          Or copy and paste this link into your browser:
                        </p>
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: 12,
                            color: emailBrand.orange,
                            wordBreak: "break-all",
                          }}
                        >
                          {inviteLink}
                        </p>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          padding: "20px 32px",
                          borderTop: `1px solid ${emailBrand.border}`,
                          backgroundColor: emailBrand.background,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 12, color: emailBrand.muted }}>
                          This invitation expires in 24 hours. If you weren&apos;t expecting this
                          email, you can safely ignore it.
                        </p>
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: emailBrand.muted }}>
                          © {new Date().getFullYear()} QB Fabrication. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}
