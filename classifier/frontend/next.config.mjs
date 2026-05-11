/** @type {import('next').NextConfig} */
const nextConfig = {
  // Forces the output to be static HTML/CSS/JS
  output: 'export',
  
  // Disable default image optimization (required for static exports as there is no Node server to resize them)
  images: {
    unoptimized: true,
  },
};
export default nextConfig;
