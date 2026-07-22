import * as React from "react"
import { emailBrand } from "@/lib/email/brand"

export interface MaterialPullEmailProps {
  fullName: string
  title: string
  body: string
  link: string
}

export function MaterialPullEmail({
  fullName,
  title,
  body,
  link,
}: MaterialPullEmailProps) {
  const firstName = fullName.split(" ")[0] || fullName

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
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
                    maxWidth: 480,
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    padding: "28px 24px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <p style={{ margin: "0 0 8px", fontSize: 14, color: "#64748b" }}>
                          QB Fabrication · Material Pull
                        </p>
                        <h1
                          style={{
                            margin: "0 0 12px",
                            fontSize: 20,
                            fontWeight: 700,
                            color: emailBrand.foreground,
                          }}
                        >
                          {title}
                        </h1>
                        <p style={{ margin: "0 0 8px", fontSize: 15 }}>
                          Hi {firstName},
                        </p>
                        <p style={{ margin: "0 0 20px", fontSize: 15 }}>{body}</p>
                        <a
                          href={link}
                          style={{
                            display: "inline-block",
                            backgroundColor: emailBrand.orange,
                            color: "#ffffff",
                            textDecoration: "none",
                            padding: "10px 18px",
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          Open request
                        </a>
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
