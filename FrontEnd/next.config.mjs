/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nécessaire pour le Dockerfile multi-stage
  output: 'standalone',

  // Images externes autorisées
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'brainykids.tn' },
      { protocol: 'http',  hostname: 'brainykids.tn' },
      { protocol: 'http',  hostname: 'brainykids.duckdns.org' },
    ],
  },

  // Variable d'environnement publique
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  },
};

export default nextConfig;
