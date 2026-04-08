function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get("url");

    if (!target) {
      return new Response("Missing ?url= parameter", {
        status: 400,
        headers: corsHeaders(),
      });
    }

    try {
      const upstream = await fetch(target);
      if (!upstream.ok) {
        return new Response(`Remote server returned ${upstream.status}`, {
          status: upstream.status,
          headers: corsHeaders(),
        });
      }

      const body = await upstream.text();
      return new Response(body, {
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") || "text/calendar",
          ...corsHeaders(),
        },
      });
    } catch (err) {
      return new Response(
        `Proxy error: ${err instanceof Error ? err.message : String(err)}`,
        { status: 502, headers: corsHeaders() },
      );
    }
  },
} satisfies ExportedHandler;
