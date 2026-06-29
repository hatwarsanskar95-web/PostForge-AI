export const BASE_FORMATTING_RULES = `FORMATTING RULES:
1. HOOK: Visually standout first line. No boring paragraphs.
2. PARAGRAPHS: Max 1-2 sentences. Mobile-first.
3. ELEMENTS: 3-10 relevant emojis, 8-12 hashtags, occasional standalone punchy lines, bullet points for features/benefits.
4. TONE: Authentic, conversational, human builder/founder. Not corporate or AI-sounding.
5. CTA: End with a meaningful discussion question.
OUTPUT: ONLY the final post text. NO internal labels (e.g. "Hook:", "CTA:").`;

export const ANTI_HALLUCINATION = `NEVER INVENT: Do not invent metrics, names, events, or facts not explicitly provided. Authenticity > Creativity.`;

export const cleanText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[\r\n]+/g, '\n') // normalize newlines
    .replace(/[ \t]+/g, ' ')   // normalize spaces and tabs
    .trim()
    .substring(0, 4000);       // Cap at 4000 chars to save tokens
};
