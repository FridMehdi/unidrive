import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export statique pour CloudFront + S3
  output: 'export',
  
  // Désactiver l'optimisation d'images (pas supporté en mode export)
  images: {
    unoptimized: true,
  },
  
  // Trailing slash pour compatibilité S3
  trailingSlash: true,
  
  // Configuration des variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.u-drive.ai/api',
  },
};

export default nextConfig;
