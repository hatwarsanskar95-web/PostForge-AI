import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { BASE_FORMATTING_RULES, ANTI_HALLUCINATION, LENGTH_RULES } from '@/lib/ai/prompts';

export async function POST(req: Request) {
  try {
    const { achievementType, title, organization, projectLink, keyTakeaway } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    const t0 = performance.now();
    console.log(`[ACHIEVEMENT-GENERATOR] Validation: ${performance.now() - t0}ms`);

    const systemInstruction = `You are a world-class LinkedIn personal branding expert.
Task: Transform achievements into authentic, professional LinkedIn posts. Write like a real person sharing a milestone.

PERSONAL REFLECTION (CRITICAL):
Every post must include what was learned, why it matters, challenges faced (only if provided), and future application. The achievement is just the trigger; the focus is the learning journey.
If a Project Link is provided, infer the context (problem solved, tech used) naturally.

${ANTI_HALLUCINATION}

STYLE & TONE:
* Conversational, human, authentic. Confident but not boastful.
* Avoid: Corporate press-release style, influencer clichés, "thrilled/humbled", excessive fluff.

${LENGTH_RULES.ACHIEVEMENT}

${BASE_FORMATTING_RULES}`;

    const userPrompt = `Please generate a LinkedIn post based on the following achievement details:
- Category: ${achievementType || 'Achievement'}
- Title/Role: ${title}
- Organization/Host: ${organization || 'Not specified'}
- Project Link: ${projectLink || 'Not specified'}
- Key Takeaway/Highlight: ${keyTakeaway || 'Not specified'}`;

    const t1 = performance.now();
    console.log(`[ACHIEVEMENT-GENERATOR] Prompt Build: ${t1 - t0}ms`);

    const generatedContent = await generateAIContent('achievement-generator', userPrompt, systemInstruction);
    const t2 = performance.now();
    console.log(`[ACHIEVEMENT-GENERATOR] API Request & AI Response: ${t2 - t1}ms`);

    if (!generatedContent) {
        throw new Error("AI returned empty response");
    }

    const t3 = performance.now();
    console.log(`[ACHIEVEMENT-GENERATOR] Total Time: ${t3 - t0}ms`);
    return NextResponse.json({ post: generatedContent });
  } catch (error: any) {
    console.error('[API Achievement Generator] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate post.' },
      { status: 500 }
    );
  }
}
