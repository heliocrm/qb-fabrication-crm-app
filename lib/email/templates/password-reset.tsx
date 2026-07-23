import * as React from "react"
import { emailBrand } from "@/lib/email/brand"

export interface PasswordResetEmailProps {
  fullName: string
  organizationName: string
  resetLink: string
  requestedByName: string
}

export function PasswordResetEmail({
  fullName,
  organizationName,
  resetLink,
  requestedByName,
}: PasswordResetEmailProps) {
  const firstName = fullName.split(" ")[0] || fullName

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reset your password</title>
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
                    <tr>
                      <td
                        style={{
                          backgroundColor: emailBrand.navy,
                          padding: "28px 32px",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#ffffff",
                          }}
                        >
                          QB Fabrication
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "32px" }}>
                        <h1
                          style={{
                            margin: "0 0 12px",
                            fontSize: 22,
                            fontWeight: 700,
                            color: emailBrand.foreground,
                          }}
                        >
                          Reset your password
                        </h1>
                        <p style={{ margin: "0 0 20px", fontSize: 15, color: emailBrand.muted }}>
                          Hi {firstName},{" "}
                          <strong style={{ color: emailBrand.foreground }}>
                            {requestedByName}
                          </strong>{" "}
                          requested a password reset for your{" "}
                          <strong style={{ color: emailBrand.foreground }}>
                            {organizationName}
                          </strong>{" "}
                          account.
                        </p>
                        <p style={{ margin: "0 0 28px", fontSize: 15, color: emailBrand.muted }}>
                          Use the button below to choose a new password.
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
                                  href={resetLink}
                                  style={{
                                    display: "inline-block",
                                    padding: "12px 28px",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#ffffff",
                                    textDecoration: "none",
                                  }}
                                >
                                  Reset password
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
                          {resetLink}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "20px 32px",
                          borderTop: `1px solid ${emailBrand.border}`,
                          backgroundColor: emailBrand.background,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 12, color: emailBrand.muted }}>
                          This link expires in 24 hours. If you weren&apos;t expecting this email,
                          you can safely ignore it.
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
