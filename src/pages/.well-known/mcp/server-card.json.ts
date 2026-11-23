/** MCP Server Card (SEP-1649) for the read-only /mcp server. */
import type { APIRoute } from 'astro';
import pkg from '../../../../package.json';
import { SITE } from '@/config/site';
import { TOOL_INFO } from '@/lib/agent-tools';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        $schema: 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
        version: '1.0',
        protocolVersion: '2025-06-18',
        serverInfo: { name: 'Kinematics', title: `${SITE.brand} 3PL and GTA delivery`, version: pkg.version },
        description: `Read-only tools for ${SITE.legalName}: services, GTA service areas, contact details, a prefilled quote link and a parcel tracking link. Nothing is submitted.`,
        transport: { type: 'streamable-http', endpoint: `${SITE.url}/mcp` },
        capabilities: { tools: { listChanged: false } },
        authentication: { required: false },
        tools: TOOL_INFO.map((t) => ({ name: t.name, description: t.description, annotations: { readOnlyHint: true } })),
        contact: { email: SITE.email, url: `${SITE.url}/contact` },
        documentation: `${SITE.url}/llms.txt`,
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
