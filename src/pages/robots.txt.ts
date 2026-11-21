import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';

/**
 * AI crawlers are explicitly allowed (GEO/AEO). To opt out of a crawler later,
 * change its rule to `Disallow: /`.
 */
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Amazonbot', 'Bingbot', 'DuckAssistBot', 'meta-externalagent', 'cohere-ai', 'MistralAI-User'];

export const GET: APIRoute = () => {
  const body = [
    '# Kinematics robots.txt',
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /thanks',
    '',
    '# AI and answer engine crawlers: allowed',
    ...AI_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', 'Disallow: /api/', '']),
    `Sitemap: ${SITE.url}/sitemap-index.xml`,
    `# LLM summary: ${SITE.url}/llms.txt`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
