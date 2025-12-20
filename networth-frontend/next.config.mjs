/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone',
    // serverActions are stable in 14, no experimental flag needed usually, 
    // but allowedOrigins inside experimental might be needed depending on patch version.
    // For 14.2.14 it is stable.
    // However, for simplicity let's stick to basic config first.
};

export default nextConfig;
