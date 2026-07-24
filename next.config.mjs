/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse", "docx"],
}

export default nextConfig
