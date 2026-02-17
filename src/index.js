export default {
  async fetch(request, env, ctx) {
    // Manual kill switch (set in Worker settings as an environment variable)
    // Example: FORCE_OUTAGE = "true"
    const forceOutage = (env.FORCE_OUTAGE || "").toLowerCase() === "true";
    if (forceOutage) return outagePage();

    // Optional: bypass for the outage page itself if you host it elsewhere
    // (not needed for this inline version)

    try {
      // Try origin normally
      const resp = await fetch(request);

      // If origin is failing, serve outage page instead
      if ([500, 502, 503, 504].includes(resp.status)) {
        return outagePage();
      }

      return resp;
    } catch (e) {
      // DNS failure, connect timeout, origin down, etc.
      return outagePage();
    }
  },
};

function outagePage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Service Outage</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
      background:#f5f5f5; color:#222; display:flex; align-items:center; justify-content:center;
      min-height:100vh; text-align:center; padding:20px; }
    .container { max-width:720px; width:100%; }
    h1 { margin:0 0 16px 0; font-size:24px; font-weight:600; }
    p { line-height:1.6; margin:10px 0; font-size:16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Service Temporarily Unavailable</h1>
    <p>
      We are working to restore the storage system and bring all services back online as quickly as possible. At this time, we expect services to remain offline until late tonight (Pacific Time).
    </p>
    <p>
      We apologize for the inconvenience and appreciate your patience. Updates will be provided as soon as more information becomes available.
    </p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      // Avoid caching the outage page at the edge or in browsers
      "Cache-Control": "no-store, no-cache, must-revalidate",
      // Helps crawlers + clients back off
      "Retry-After": "3600",
    },
  });
}

