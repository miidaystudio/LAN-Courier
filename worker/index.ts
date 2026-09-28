export interface Env {
  ASSETS?: Fetcher;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Serve using Cloudflare Workers Static Assets binding (env.ASSETS)
    if (env.ASSETS) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }

      // 2. SPA Fallback: Serve /index.html for client-side routes
      const spaRequest = new Request(new URL('/index.html', url.origin), request);
      return env.ASSETS.fetch(spaRequest);
    }

    return new Response('CourierStudio Static Assets binding not found. Ensure [assets] directory = "./client/dist" is configured in wrangler.toml.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
