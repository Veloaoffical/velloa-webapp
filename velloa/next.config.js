/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['wjimlmhgabvojfoutcrq.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wjimlmhgabvojfoutcrq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'docuseal.com',
        port: '',
        pathname: '/file/**',
      },
    ],
  },
}

module.exports = nextConfig