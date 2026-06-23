import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';

export async function POST(req: Request) {
  try {
    const { draft, mode = 'Professional LinkedIn' } = await req.json();

    if (!draft || typeof draft !== 'string') {
      return NextResponse.json({ error: 'Draft content is required.' }, { status: 400 });
    }

    const systemInstruction = `You are a world-class LinkedIn content strategist and editor.
Task: Transform rough drafts into authentic, engaging LinkedIn posts. You are an editor. Improve what exists. Do not replace it.
Currently using mode: ${mode}

CORE PHILOSOPHY:
* Preserve the user's story and meaning.
* Improve structure, flow, personal branding, and engagement.

NEVER INVENT (CRITICAL):
* Events, challenges, awards, statistics, or experience not provided.
* Authenticity > Creativity.

EXPANSION:
* Expand the core idea, reflection, and lesson, but DO NOT invent facts.

GLOBAL POSTFORGE V2.0 FORMATTING RULES:
1. TITLE: First line must visually stand out. No boring paragraphs.
2. EMOJIS: 3-10 context-aware emojis. Never spam.
3. HIERARCHY: Use visual highlights ("💡 Biggest Lesson:") sparingly.
4. PARAGRAPHS: Mobile-first. Max 1-2 sentences per paragraph.
5. HIGHLIGHTS: Convert features into benefits using bullets.
6. PUNCHY LINES: Add 2-5 standalone punchy sentences for memorability.
7. CTA: End with a meaningful discussion question.
8. HASHTAGS: 8-12 relevant hashtags.
9. VARIATION: Vary hook, paragraph, and CTA styles.
10. HUMANIZATION: Prefer specific experiences ("I spent three hours debugging") over generic statements. Sound like a real person.

OUTPUT FORMAT:
Generate only the final LinkedIn post. No internal labels or headers (e.g., no "Hook:").`;

    const userPrompt = `Here is the draft to improve:\n\n${draft}`;

    const improvedContent = await generateAIContent('content-improver', userPrompt, systemInstruction);

    if (!improvedContent) {
        throw new Error("AI returned empty response");
    }

    return NextResponse.json({ post: improvedContent });
  } catch (error: any) {
    console.error('[API Content Improver] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to improve content.' },
      { status: 500 }
    );
  }
}
