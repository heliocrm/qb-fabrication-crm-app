# Traveler template assets

Official shop assets (bundled from Trevor’s traveler automation):

| File | Role |
|------|------|
| `QB_Traveler_Master_Copy.docx` | Word master filled by `lib/travelers/write-traveler.ts` |
| `signature.png` | Drawing-packet stamp signature (also served from `public/travelers/signature.png`) |
| `logo.png` | Optional branding asset |

`buildTravelerDocx` fills the master template when present; otherwise it falls back to a synthetic DOCX with the same fields.

Drawing packet stamp text: **DRAWINGS ISSUED FOR QB FABRICATION** + Rev + signature + Order Date.
