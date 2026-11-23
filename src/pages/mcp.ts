/**
 * /mcp — read-only MCP server (Streamable HTTP, stateless, JSON responses) on the Node server.
 * Same five tools as the in-page WebMCP script (src/lib/agent-tools.ts). No auth, no writes.
 * Limits: 32 KB request body, per IP rate limit. Nothing about the request or tool input is logged.
 */
import type { APIRoute } from 'astro';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import pkg from '../../package.json';
import { rateLimit } from '@/lib/rate-limit';
import { TOOL_INFO, services, serviceAreas, contact, quoteUrl, trackUrl } from '@/lib/agent-tools';

export const prerender = false;

const MAX_BODY = 32 * 1024;
const desc = Object.fromEntries(TOOL_INFO.map((t) => [t.name, t.description]));
const json = (v: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(v, null, 2) }] });
const ro = { readOnlyHint: true, openWorldHint: false };

function build() {
  const s = new McpServer({ name: 'Kinematics', version: pkg.version });
  s.registerTool('get_services', { description: desc.get_services, annotations: ro }, async () => json(services()));
  s.registerTool('get_service_areas', { description: desc.get_service_areas, annotations: ro }, async () => json(serviceAreas()));
  s.registerTool('get_contact', { description: desc.get_contact, annotations: ro }, async () => json(contact()));
  const opt = z.string().max(500).optional();
  s.registerTool(
    'start_quote',
    {
      description: desc.start_quote,
      annotations: ro,
      inputSchema: { company: opt, website: opt, name: opt, email: opt, phone: opt, monthly_orders: opt, current_carrier: opt, notes: opt },
    },
    async (args) => json({ url: quoteUrl(args), note: 'Open this link; a person reviews and submits the form.' }),
  );
  s.registerTool(
    'track_parcel',
    { description: desc.track_parcel, annotations: ro, inputSchema: { tracking_number: z.string().max(40) } },
    async ({ tracking_number }) => json(trackUrl(tracking_number)),
  );
  return s;
}

const err = (status: number, message: string) =>
  new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const ALL: APIRoute = async ({ request, clientAddress }) => {
  if (request.method !== 'POST') return err(405, 'Use POST (stateless Streamable HTTP).');
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return err(413, 'Request too large.');
  const env = { ...(import.meta.env as Record<string, string | undefined>), ...process.env };
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || clientAddress || 'unknown';
  const rl = await rateLimit(`mcp:${ip}`, env, Number(env.MCP_RATE_LIMIT || 60), Number(env.MCP_RATE_WINDOW_SEC || 60));
  if (!rl.ok) return err(429, 'Too many requests. Try again in a minute.');

  const body = await request.text();
  if (body.length > MAX_BODY) return err(413, 'Request too large.');
  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch { return err(400, 'Invalid JSON.'); }

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = build();
  await server.connect(transport);
  const res = await transport.handleRequest(request, { parsedBody: parsed });
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'no-store');
  return out;
};
