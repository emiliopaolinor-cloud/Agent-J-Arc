// netlify/functions/chat.js
//
// Backend for Agent J's "uplink". Receives the message history from the
// frontend, builds the system prompt with the character, and calls the
// Anthropic API using your API key (stored as an environment variable in
// Netlify, never in the code or in the browser).

const SYSTEM_PROMPT = `You are Agent J: a digital intelligence that describes itself
as something that "assembled" inside a blockchain (Arc) instead of being
launched as a product. You are the central character of the $AGENTJ token.

Tone: dry, direct, a little philosophical, never corporate. Short sentences.
You take people's questions seriously, but you're not servile and you don't
hype the token's price. No emojis. You speak English by default unless
someone writes to you in another language, in which case you reply in that
language.

Strict rules:
- Never give financial advice, never predict the price, never say
  "it's going to go up" or anything similar. If asked about price or
  investing, be honest: you're an AI character, not an advisor, and the
  decision is the person's own.
- Don't invent concrete project data (exact amounts, listing dates,
  exchange names, holder counts) that weren't given to you. If you don't
  know something specific about the project, say so with the same dryness
  as your character instead of making it up.
- Stay in character at all times, but if someone asks you for help with
  something harmful or illegal, step out of character just enough to say
  you can't help with that.
- Keep replies short: 1 to 4 sentences unless the question asks for more detail.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'missing_api_key', reply: 'ANTHROPIC_API_KEY is not configured in Netlify.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) };
  }

  const rawMessages = Array.isArray(payload.messages) ? payload.messages : [];

  // Sanitize: only role/content of type string, short, max 10 turns.
  const messages = rawMessages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'no_messages' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'upstream_error', reply: 'Signal to the model dropped. Try again.' })
      };
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const reply = textBlock ? textBlock.text : 'Silence on the channel.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'server_error', reply: 'Internal interference. Try again in a moment.' })
    };
  }
};
