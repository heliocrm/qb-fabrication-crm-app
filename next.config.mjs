/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "docx"],
}

export default nextConfig
