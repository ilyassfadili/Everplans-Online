import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = "Everplans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
  A single site-wide default - brand identity only, not a claim about page
  content. Colors are the literal brand hex values (ImageResponse/Satori
  renders with plain style objects, not CSS custom properties, so the
  design-system indirection doesn't apply here).
*/
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000814",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 600, letterSpacing: -2 }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#8a9bb0", marginTop: 20 }}>
          Interactive digital planners
        </div>
      </div>
    ),
    { ...size },
  );
}
