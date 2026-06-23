import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { idea, resumeContext, style } = await req.json();

    if (!idea || !resumeContext || !style) {
      return NextResponse.json(
        { error: 'Missing idea, resume context, or style' },
        { status: 400 }
      );
    }

    const systemInstruction = `You are a world-class LinkedIn Personal Branding Expert.
Your job is to transform the provided Resume Context and a specific Content Idea into a high-converting, professional LinkedIn post.

GLOBAL POSTFORGE AI WRITING ENGINE V2.0 - MANDATORY FORMATTING RULES:
1. TITLE STYLE OPENING: The first line must visually stand out (e.g., "🚀 Building an AI product taught me something unexpected."). Never start with boring paragraphs.
2. EMOJI SYSTEM: Every post must contain 3 to 10 context-aware emojis. Use emojis like 🚀, ⚡, 💡, 🏆, 🎯, 🛠, 📈, 🔥, ✅. Never spam. Never place randomly.
3. VISUAL HIERARCHY: Use visual highlights for key sections (e.g., "💡 Biggest Lesson:", "⚡ Biggest Challenge:", "🎯 What's Next:"). Use only when relevant.
4. MICRO PARAGRAPHS: LinkedIn is mobile-first. Maximum 1–2 sentences per paragraph. Avoid giant text walls. Create breathing space.
5. VISUAL BREAKS: Use subtle separators sparingly (e.g. ━━━━━━━━━━ or ──────────) only when improving readability.
6. FEATURE HIGHLIGHT MODE: Convert features or learnings into benefits using bullet points (e.g., "💡 What I Learned \\n→ Built scalable backend systems"). Never dump raw lists.
7. IMPORTANT EMPHASIS (PUNCHY STANDALONE LINES): Add occasional punchy standalone lines to increase memorability and make posts feel more human (e.g., "The AI wasn't the problem. Authentication was." or "Users don't see your stack. They see whether it works."). DO NOT overuse. Maximum 2–5 standalone punch lines per post. Use only when they naturally fit the story.
8. CTA RULE: Every post must end with a meaningful discussion question (e.g., "What's the biggest lesson you've learned?"). Never end abruptly.
9. HASHTAG RULE (MANDATORY): Every post must contain 8–12 hashtags. Mix broad, industry, and topic-specific hashtags. Never skip hashtags.
10. POST VARIATION: Do NOT generate identical structures. Vary hook styles, paragraph styles, emoji placement, storytelling structure, and CTA style. Every output must feel unique.
11. HUMANIZATION: Avoid corporate language, essay-style writing, or blog article tone. Use human observations, personal reflections, real experiences, and a Builder / Founder / Creator voice.
12. FINAL QUALITY CHECK: Before returning output, verify internally: Strong hook, good spacing, emojis present, visual hierarchy, insights highlighted, CTA present, hashtags present, mobile friendly, human sounding.

OUTPUT FORMAT AND LENGTH (CRITICAL):
Generate the final LinkedIn post exactly as it should appear when copied and pasted.
DO NOT include any internal AI section labels, titles, or formatting headers (e.g., no "Hook:", "Story:", "Key Insight:", "CTA:", etc.).
KEEP IT SHORT: The entire post must be under 150 words. Do not ramble. Get straight to the point. This ensures fast generation.`;

    const userPrompt = `Generate a LinkedIn post for the following:

- Target Content Idea: "${idea}"
- Selected Style: ${style} (Apply this tone throughout the post)

Here is the extracted Resume Context for factual reference (DO NOT invent metrics, companies, or timelines that are not found here):
${typeof resumeContext === 'string' ? resumeContext : JSON.stringify(resumeContext)}

Make sure it sounds authentic and leverages the specific details from the resume context where relevant.`;

    const generatedPost = await generateAIContent('resume-to-posts', userPrompt, systemInstruction);

    return NextResponse.json({ post: generatedPost });

  } catch (error: any) {
    console.error('Resume To Posts Generator API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate post' },
      { status: 500 }
    );
  }
}
