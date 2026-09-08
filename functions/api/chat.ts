/// <reference types="@cloudflare/workers-types" />

// Cloudflare Pages Function — served at /api/chat.
//
// Any real API key lives ONLY here, as a Cloudflare secret (never shipped
// to the browser). Set it with:
//   npx wrangler pages secret put ANTHROPIC_API_KEY
// or add it under Pages > Settings > Environment variables in the
// Cloudflare dashboard. Until then, this endpoint answers every question
// with the deterministic, resume-grounded local engine — a complete,
// working assistant with zero external dependency.

import { localAnswer, buildSystemPrompt, type ChatMessage } from '../../src/lib/assistant';

interface Env {
  ANTHROPIC_API_KEY?: string;
}

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 8;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function askClaude(apiKey: string, message: string, history: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: buildSystemPrompt(),
      messages: [...history, { role: 'user', content: message }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API responded with ${res.status}`);
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === 'text')?.text?.trim();
  if (!text) throw new Error('Empty response from Anthropic API');
  return text;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { message?: unknown; history?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return json({ reply: "I couldn't read that question — mind trying again?" }, 400);
  }

  const message = typeof body.message === 'string' ? body.message.slice(0, MAX_MESSAGE_LENGTH) : '';
  if (!message.trim()) {
    return json({ reply: 'Ask me something about experience, projects, skills, or education.' }, 400);
  }

  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history: ChatMessage[] = rawHistory
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
    .slice(-MAX_HISTORY);

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const reply = await askClaude(apiKey, message, history);
      return json({ reply, source: 'ai' });
    } catch {
      // Fall through to the local engine — the assistant should never just
      // error out for a visitor because the upstream API had a bad moment.
    }
  }

  return json({ reply: localAnswer(message), source: 'local' });
};

export const onRequestGet: PagesFunction = async () => {
  return json({ status: 'ok', message: 'POST a { message, history } body to chat.' });
};
