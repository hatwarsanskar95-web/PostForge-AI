import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { BASE_FORMATTING_RULES, ANTI_HALLUCINATION, LENGTH_RULES } from '@/lib/ai/prompts';

export async function POST(req: Request) {
  try {
    const { topic, audience, role } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const t0 = performance.now();
    console.log(`[POST-GENERATOR] Validation: ${performance.now() - t0}ms`);

    const systemInstruction = `You are a world-class LinkedIn content strategist.
Task: Create authentic, engaging, professional LinkedIn posts. Write like a real human (founder, engineer, creator) sharing a genuine experience.

${ANTI_HALLUCINATION}

${LENGTH_RULES.POST_GENERATOR}

${BASE_FORMATTING_RULES}`;

    const userPrompt = `Please generate a LinkedIn post based on the following details:
- Topic/Draft: ${topic}
- Target Audience: ${audience || 'General professional network'}
- My Role/Context: ${role || 'Professional'}`;

    const t1 = performance.now();
    console.log(`[POST-GENERATOR] Prompt Build: ${t1 - t0}ms`);

    const generatedContent = await generateAIContent('post-generator', userPrompt, systemInstruction);
    const t2 = performance.now();
    console.log(`[POST-GENERATOR] API Request & AI Response: ${t2 - t1}ms`);

    if (!generatedContent) {
        throw new Error("AI returned empty response");
    }

    const t3 = performance.now();
    console.log(`[POST-GENERATOR] Total Time: ${t3 - t0}ms`);
    return NextResponse.json({ post: generatedContent });
  } catch (error: any) {
    console.error('[API Post Generator] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate post.' },
      { status: 500 }
    );
  }
}
