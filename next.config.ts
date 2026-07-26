import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /geotab pulls several large payloads (tens of MB) from the Geotab OData
  // connector; the default 60s static-generation timeout isn't enough.
  staticPageGenerationTimeout: 180,
};

export default nextConfig;
