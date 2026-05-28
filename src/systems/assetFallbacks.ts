const fallbackBackgroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="#28315f"/>
      <stop offset="52%" stop-color="#111733"/>
      <stop offset="100%" stop-color="#070916"/>
    </radialGradient>
    <linearGradient id="line" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#8cdcff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#bc89ff" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#glow)"/>
  <g opacity="0.18" stroke="url(#line)" stroke-width="2">
    <path d="M210 210h1500v660H210z"/>
    <path d="M300 300h1320v480H300z"/>
    <path d="M0 540h1920M960 0v1080"/>
  </g>
  <g font-family="Arial, sans-serif" text-anchor="middle">
    <text x="960" y="506" fill="#f1dcff" font-size="52" font-weight="700">Background Missing</text>
    <text x="960" y="566" fill="#8cdcff" font-size="26">Fallback backdrop is active</text>
  </g>
</svg>`;

export const fallbackBackgroundImagePath = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  fallbackBackgroundSvg,
)}`;

const warnedAssetKeys = new Set<string>();

export function warnAssetFallbackOnce(assetKey: string, message: string): void {
  if (!import.meta.env.DEV || warnedAssetKeys.has(assetKey)) {
    return;
  }

  warnedAssetKeys.add(assetKey);
  console.warn(message);
}
