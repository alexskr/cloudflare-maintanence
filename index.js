export default {
  async fetch(request, env, ctx) {
    // Manual override (can come from env var or KV)
    const FORCE_OUTAGE = env.FORCE_OUTAGE === "true";

    if (FORCE_OUTAGE) {
      return outageResponse();
    }

    try {
      const response = await fetch(request);

      // If origin returns hard failure, treat as outage
      if ([500, 502, 503, 504].includes(response.status)) {
        return outageResponse();
      }

      return response;
    } catch (err) {
      // Network failure, DNS issue, origin unreachable
      return outageResponse();
    }
  }
};

function outageResponse() {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>This site is currently unavailable due to infrastructure issues.</title>
        <meta charset="utf-8" />
      </head>
      <body>
        <h1>This site is currently unavailable due to infrastructure issues</h1>
        <p>We are working to restore the storage system and bring all services back online as quickly as possible. At this time, we expect services to remain offline until late tonight (Pacific Time).
We apologize for the inconvenience and appreciate your patience. Updates will be provided as soon as more information becomes available.</p>
        <p>Please check back later.</p>
      </body>
    </html>
  `, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Retry-After": "3600"
    }
  });
}
