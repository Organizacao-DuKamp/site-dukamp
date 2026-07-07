// Optimized image URL helper.
// For Supabase Storage URLs, rewrites `/storage/v1/object/` to
// `/storage/v1/render/image/` and appends transform params so the CDN
// returns a resized WebP instead of the original (often multi-MB) file.
export function optimizedImage(
  url: string | null | undefined,
  opts: { width?: number; quality?: number } = {},
): string {
  if (!url) return "/placeholder.svg";
  const { width = 600, quality = 75 } = opts;
  try {
    if (url.includes("/storage/v1/object/")) {
      const u = new URL(url);
      u.pathname = u.pathname.replace("/storage/v1/object/", "/storage/v1/render/image/");
      u.searchParams.set("width", String(width));
      u.searchParams.set("quality", String(quality));
      u.searchParams.set("resize", "contain");
      return u.toString();
    }
  } catch {
    // fall through
  }
  return url;
}
