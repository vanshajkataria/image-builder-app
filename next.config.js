/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // no server-side image optimization — everything runs in the browser
  },
};

module.exports = nextConfig;
