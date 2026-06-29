import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { BASE_FORMATTING_RULES, ANTI_HALLUCINATION, LENGTH_RULES } from '@/lib/ai/prompts';

export async function POST(req: Request) {
  try {
    const { draft, mode = 'Professional LinkedIn' } = await req.json();

    if (!draft || typeof draft !== 'string') {
      return NextResponse.json({ error: 'Draft content is required.' }, { status: 400 });
    }
    const t0 = performance.now();
    console.log(`[CONTENT-IMPROVER] Validation: ${performance.now() - t0}ms`);

    const systemInstruction = `You are a world-class LinkedIn content strategist and editor.
Task: Transform rough drafts into authentic, engaging LinkedIn posts. You are an editor. Improve what exists. Do not replace it.
Currently using mode: ${mode}

CORE PHILOSOPHY:
* Preserve the user's story and meaning.
* Improve structure, flow, personal branding, and engagement.

${ANTI_HALLUCINATION}

${LENGTH_RULES.CONTENT_IMPROVER}

${BASE_FORMATTING_RULES}`;

    const userPrompt = `Here is the draft to improve:\n\n${draft}`;
    
    const t1 = performance.now();
    console.log(`[CONTENT-IMPROVER] Prompt Build: ${t1 - t0}ms`);

    const improvedContent = await generateAIContent('content-improver', userPrompt, systemInstruction);
    const t2 = performance.now();
    console.log(`[CONTENT-IMPROVER] API Request & AI Response: ${t2 - t1}ms`);

    if (!improvedContent) {
        throw new Error("AI returned empty response");
    }

    const t3 = performance.now();
    console.log(`[CONTENT-IMPROVER] Total Time: ${t3 - t0}ms`);
    return NextResponse.json({ post: improvedContent });
  } catch (error: any) {
    console.error('[API Content Improver] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to improve content.' },
      { status: 500 }
    );
  }
}
