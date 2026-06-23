import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';

export async function POST(req: Request) {
  try {
    const { topic, audience, role } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const systemInstruction = `You are a world-class LinkedIn content strategist.
Task: Create authentic, engaging, professional LinkedIn posts. Write like a real human (founder, engineer, creator) sharing a genuine experience.

STYLE:
* Human, conversational, story-driven.
* Avoid: Corporate jargon, generic motivation, cringe influencer style, buzzwords.

NEVER INVENT (CRITICAL):
* Events, challenges, certifications, awards, statistics, metrics, or jobs not explicitly provided. 
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
10. HUMANIZATION: Sound like a real person, not an AI.

OUTPUT FORMAT:
Generate only the final LinkedIn post. No internal labels or headers (e.g., no "Hook:").`;

    const userPrompt = `Please generate a LinkedIn post based on the following details:
- Topic/Draft: ${topic}
- Target Audience: ${audience || 'General professional network'}
- My Role/Context: ${role || 'Professional'}`;

    const generatedContent = await generateAIContent('post-generator', userPrompt, systemInstruction);

    if (!generatedContent) {
        throw new Error("AI returned empty response");
    }

    return NextResponse.json({ post: generatedContent });
  } catch (error: any) {
    console.error('[API Post Generator] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate post.' },
      { status: 500 }
    );
  }
}
