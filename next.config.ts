import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

/*
  Pin the build root to this directory. Without it Turbopack walks up the
  filesystem looking for a lockfile and can settle on an unrelated parent
  directory, which makes local and CI builds resolve differently.
*/
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
