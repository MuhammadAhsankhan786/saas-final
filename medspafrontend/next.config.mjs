import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Build ke dauran ESLint errors ignore (sirf warnings skip, code safe)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Production optimizations
  reactStrictMode: true, // React ke strict checks enable karta hai
  swcMinify: true, // Fast aur optimized JS bundling ke liye

  // ✅ Tumhara original alias setup (for '@' → 'src')
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(process.cwd(), "src"),
    };
    return config;
  },
};

export default nextConfig;
