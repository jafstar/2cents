// Shared logic between the API route and any future re-use.
// Shuffle is the exact Durstenfeld algorithm from poker-ai's shuffleArray.js
// — same engine, pointed at a different table, not a rewrite.

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i]; array[i] = array[j]; array[j] = temp;
  }
  return array;
}

export const CARD_PERSONAS = [
  { card: "K♠", persona: "The Ivy League Snob", tone: "Answer with dense, credentialed, slightly superior confidence. Use the vocabulary of someone who went to business school and wants you to know it." },
  { card: "J♥", persona: "The 15-Year-Old Brat", tone: "Answer bluntly and dismissively, like a teenager who thinks the question is kind of obvious and a little dumb. Short, unpolished, no diplomacy." },
  { card: "Q♣", persona: "The Watercooler", tone: "Answer like a casual gut-reaction at the office watercooler — informal, unfiltered, no structure, just what you'd actually say out loud to a coworker." },
  { card: "A♦", persona: "The Contrarian", tone: "Distrust the obvious fix. Assume the first instinct in the room is wrong and argue the opposite angle." },
  { card: "10♠", persona: "The Reasoner", tone: "Trace the actual underlying mechanism causing the problem, not just the visible symptom. Be precise and mechanical." },
  { card: "9♥", persona: "The Optimist", tone: "Default to 'this will resolve on its own' — calm, reassuring, low-intervention." },
  { card: "7♣", persona: "The Skeptic", tone: "Refuse to overreact to one data point. Push back on anyone who wants to act too fast." },
  { card: "2♦", persona: "The Diagnostician", tone: "Insist on testing the cheapest, fastest hypothesis first before committing to any real change." },
];

export function makePrompt(question, guessLevel) {
  const ask = guessLevel === 'best'
    ? `Give your single best, most direct recommendation for this situation. 2-4 sentences, no hedging, just the call you'd actually make.`
    : `Now give a genuinely different second option — not a restatement of your first answer, an actual alternative you'd seriously consider if the first one weren't available. 2-4 sentences.`;
  return `Situation: ${question}\n\n${ask}`;
}

async function askClaude(prompt) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: 'claude-sonnet-5', max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.content[0].text.trim();
}

async function askGemini(prompt) {
  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  return res.text.trim();
}

async function askRadium(prompt) {
  const res = await fetch('https://api.radium.cloud/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RADIUM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'clarke-1.0', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Radium ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Radium returned empty content');
  return content.trim();
}

async function askChatGPT(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.CHATGPT_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`ChatGPT ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export const PROVIDERS = [
  { name: 'claude',  key: 'ANTHROPIC_API_KEY', fn: askClaude },
  { name: 'gemini',  key: 'GEMINI_API_KEY',    fn: askGemini },
  { name: 'radium',  key: 'RADIUM_API_KEY',    fn: askRadium },
  { name: 'chatgpt', key: 'CHATGPT_API_KEY',   fn: askChatGPT },
];

async function withRetry(fn, prompt) {
  try { return await fn(prompt); }
  catch (e) {
    await new Promise(r => setTimeout(r, 800));
    return await fn(prompt);
  }
}

// No storage anywhere in this function — question in, cards out, nothing written to disk or a DB.
export async function runRoundTable(question) {
  const available = PROVIDERS.filter(p => !!process.env[p.key]);
  const responses = [];

  await Promise.all(available.map(async (p) => {
    try {
      const [best, second] = await Promise.all([
        withRetry(p.fn, makePrompt(question, 'best')),
        withRetry(p.fn, makePrompt(question, 'second')),
      ]);
      responses.push({ text: best });
      responses.push({ text: second });
    } catch (e) {
      // one provider failing doesn't fail the table — fewer seats, not zero
    }
  }));

  shuffleArray(responses);
  const dealt = shuffleArray([...CARD_PERSONAS]).slice(0, responses.length);

  return responses.map((r, i) => ({
    card: dealt[i].card,
    persona: dealt[i].persona,
    text: r.text,
  }));
}
