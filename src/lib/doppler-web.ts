/**
 * The Mini App takes no payments itself. doppler-web owns checkout (Revolut for cards,
 * OxaPay for crypto), promo pricing, and the webhooks that grant Pro.
 */
function baseUrl(): string {
  const url = process.env.DOPPLER_WEB_URL;
  if (!url) throw new Error('DOPPLER_WEB_URL is not configured');
  return url.replace(/\/$/, '');
}

export async function postDopplerWeb(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
