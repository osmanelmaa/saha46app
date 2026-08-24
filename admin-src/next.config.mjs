/** @type {import('next').NextConfig} */
const nextConfig = {
  // Statik dışa aktarım: sunucu gerektirmez, Vercel ya da Cloudflare'e düz dosya olarak çıkar.
  output: 'export',
  // Panel sitenin kökünde değil, /admin alt yolunda yayınlanır.
  basePath: '/admin',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
