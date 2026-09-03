import type {
  NextConfig,
} from "next"

const baseSecurityHeaders = [
  {
    key:
      "X-Content-Type-Options",

    value:
      "nosniff",
  },
  {
    key:
      "X-Frame-Options",

    value:
      "DENY",
  },
  {
    key:
      "Referrer-Policy",

    value:
      "no-referrer",
  },
  {
    key:
      "Permissions-Policy",

    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key:
      "Cross-Origin-Opener-Policy",

    value:
      "same-origin",
  },
  {
    key:
      "X-DNS-Prefetch-Control",

    value:
      "off",
  },
] as const

const sensitivePortalHeaders = [
  {
    key:
      "Cache-Control",

    value:
      "private, no-store, max-age=0, must-revalidate",
  },
  {
    key:
      "Pragma",

    value:
      "no-cache",
  },
  {
    key:
      "Expires",

    value:
      "0",
  },
  {
    key:
      "X-Robots-Tag",

    value:
      "noindex, nofollow, noarchive, nosnippet",
  },
] as const

const sensitivePortalSources = [
  "/staff/:path*",
  "/admin/:path*",
  "/reception/:path*",
  "/doctor/:path*",
  "/laboratory/:path*",
  "/cashier/:path*",
  "/patient/:path*",
] as const

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source:
          "/:path*",

        headers: [
          ...baseSecurityHeaders,
        ],
      },

      ...sensitivePortalSources.map(
        (source) => ({
          source,

          headers: [
            ...sensitivePortalHeaders,
          ],
        })
      ),
    ]
  },
}

export default nextConfig
