/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "@react-pdf/renderer"],
};

module.exports = nextConfig;
