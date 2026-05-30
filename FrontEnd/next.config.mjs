/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nécessaire pour le Dockerfile multi-stage
  output: 'standalone',

  // En dev (sans nginx), proxie /uploads/ vers le backend directement
  async rewrites() {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');
    return [
      { source: '/uploads/:path*', destination: `${apiBase}/uploads/:path*` },
    ];
  },

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
