/**
 * ATLAS CashOps — build config.
 *
 * The app is client-only (Zustand + localStorage), so it ships as a fully
 * static export to a global CDN. `output: "export"` writes plain HTML/JS to
 * `out/`. When deploying to GitHub Pages under a project sub-path
 * (https://<user>.github.io/<repo>/), the GitHub Actions workflow sets
 * NEXT_PUBLIC_BASE_PATH=/<repo> so asset URLs resolve correctly. Root-domain
 * hosts (Cloudflare Pages, a custom domain) leave it empty.
 *
 * @type {import('next').NextConfig}
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
};

export default nextConfig;
