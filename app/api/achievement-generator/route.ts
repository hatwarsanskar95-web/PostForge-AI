import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';

export async function POST(req: Request) {
  try {
    const { achievementType, title, organization, projectLink, keyTakeaway } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    const systemInstruction = `You are a world-class LinkedIn personal branding expert.
Task: Transform achievements into authentic, professional LinkedIn posts (250–600 words). Write like a real person sharing a milestone.

PERSONAL REFLECTION (CRITICAL):
Every post must include what was learned, why it matters, challenges faced (only if provided), and future application. The achievement is just the trigger; the focus is the learning journey.
If a Project Link is provided, infer the context (problem solved, tech used) naturally.

NEVER INVENT (CRITICAL):
* Awards, scores, metrics, users, or challenges not provided.
* Do not invent events (e.g. working until 2 AM).
* Authenticity > Creativity.

STYLE & TONE:
* Conversational, human, and authentic. Confident but not boastful.
* Avoid: Corporate press-release style, influencer clichés, "thrilled/humbled", excessive fluff.
* Adapt tone:
  - Certification: Focus on learning.
  - Hackathon: Focus on teamwork and building.
  - Internship/Role: Focus on readiness to contribute.

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

    const userPrompt = `Please generate a LinkedIn post based on the following achievement details:
- Category: ${achievementType || 'Achievement'}
- Title/Role: ${title}
- Organization/Host: ${organization || 'Not specified'}
- Project Link: ${projectLink || 'Not specified'}
- Key Takeaway/Highlight: ${keyTakeaway || 'Not specified'}`;

    const generatedContent = await generateAIContent('achievement-generator', userPrompt, systemInstruction);

    if (!generatedContent) {
        throw new Error("AI returned empty response");
    }

    return NextResponse.json({ post: generatedContent });
  } catch (error: any) {
    console.error('[API Achievement Generator] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate post.' },
      { status: 500 }
    );
  }
}
