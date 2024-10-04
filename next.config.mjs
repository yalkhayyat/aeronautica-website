/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '*.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
    },
  };
  
  export default nextConfig;
