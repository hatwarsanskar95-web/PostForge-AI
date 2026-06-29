import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { cleanText, BASE_FORMATTING_RULES, ANTI_HALLUCINATION, LENGTH_RULES } from '@/lib/ai/prompts';

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
    const t0 = performance.now();
    console.log(`[RESUME-TO-POSTS] Validation: ${performance.now() - t0}ms`);

    const systemInstruction = `You are a world-class LinkedIn Personal Branding Expert.
Your job is to transform the provided Resume Context and a specific Content Idea into a high-converting, professional LinkedIn post.

${ANTI_HALLUCINATION}

${LENGTH_RULES.RESUME}

${BASE_FORMATTING_RULES}`;

    const cleanedResumeContext = cleanText(typeof resumeContext === 'string' ? resumeContext : JSON.stringify(resumeContext));

    const userPrompt = `Generate a LinkedIn post for the following:

- Target Content Idea: "${idea}"
- Selected Style: ${style} (Apply this tone throughout the post)

Here is the extracted Resume Context for factual reference (DO NOT invent metrics, companies, or timelines that are not found here):
${cleanedResumeContext}

Make sure it sounds authentic and leverages the specific details from the resume context where relevant.`;

    const t1 = performance.now();
    console.log(`[RESUME-TO-POSTS] Prompt Build: ${t1 - t0}ms`);

    const generatedPost = await generateAIContent(
      'resume-to-posts',
      userPrompt,
      systemInstruction,
    );
    const t2 = performance.now();
    console.log(`[RESUME-TO-POSTS] API Request & AI Response: ${t2 - t1}ms`);

    if (!generatedPost || generatedPost.trim().length === 0) {
      return NextResponse.json(
        { error: 'We couldn\'t generate the post. Please try again.' },
        { status: 500 }
      );
    }
    console.log(`[RESUME-TO-POSTS] Total Time: ${performance.now() - t0}ms`);
    return NextResponse.json({ post: generatedPost });

  } catch (error: any) {
    console.error('Resume To Posts Generator API Error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t process the AI response. Please regenerate.' },
      { status: 500 }
    );
  }
}
