/**
 * Converts various Google Drive share URLs to a direct embeddable image URL.
 * Supports all image formats (JPEG, PNG, WebP, GIF, SVG, BMP, AVIF, …).
 *
 * Accepted input formats:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 *   https://drive.google.com/thumbnail?id=FILE_ID&sz=…
 */
export function resolveImageUrl(url: string): string {
  if (!url) return url

  // Already a direct thumbnail link — normalise sz to w1200 for quality
  const thumbMatch = url.match(/drive\.google\.com\/thumbnail\?.*id=([^&]+)/)
  if (thumbMatch) {
    return `https://drive.google.com/thumbnail?id=${thumbMatch[1]}&sz=w1200`
  }

  // /file/d/FILE_ID/…
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1200`
  }

  // ?id=FILE_ID (open or uc links)
  const idMatch = url.match(/drive\.google\.com\/(?:open|uc)\?.*[?&]id=([^&]+)/)
  if (idMatch) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`
  }

  return url
}
