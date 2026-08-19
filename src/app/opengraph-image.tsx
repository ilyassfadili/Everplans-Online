import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Everplans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
  Asset doesn't depend on request data, so read it once at module scope
  rather than per-request. The white "dark-mode-logo" variant, not the
  header's dark-navy one - this canvas is `bg-deep` (#000814), same
  reasoning as the Footer's Logo tone="on-dark" (see logo.tsx).
*/
const logoData = await readFile(
  join(process.cwd(), "public/dark-mode-logo/logo.png"),
  "base64",
);
const logoSrc = `data:image/png;base64,${logoData}`;

/*
  A single site-wide default - brand identity only, not a claim about page
  content. Colors are the literal brand hex values (ImageResponse/Satori
  renders with plain style objects, not CSS custom properties, so the
  design-system indirection doesn't apply here).

  Logo rendered at 588x220 - the dark-mode asset's native ~2.67:1 ratio
  (it's a tighter crop than the header's, no tagline baked in), sized to
  ~49% of the 1200px canvas width. Large enough to read as the focal point,
  small enough to leave real margin on all sides rather than crowding the
  edges.
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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) requires
            a plain <img>; next/image doesn't run in this renderer. */}
        <img src={logoSrc} alt="" width={588} height={220} />
        <div style={{ display: "flex", fontSize: 32, color: "#8a9bb0", marginTop: 28 }}>
          Interactive digital planners
        </div>
      </div>
    ),
    { ...size },
  );
}
