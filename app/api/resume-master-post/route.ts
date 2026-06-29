import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { cleanText, BASE_FORMATTING_RULES, ANTI_HALLUCINATION, LENGTH_RULES } from '@/lib/ai/prompts';

export const maxDuration = 120; // Allow 2 minutes for 3-part parallel generation

export async function POST(req: Request) {
  const t0 = Date.now();
  console.log(`[Master Post API] Start request processing`);
  try {
    const { resumeContext } = await req.json();

    if (!resumeContext) {
      return NextResponse.json(
        { error: 'Missing resume context' },
        { status: 400 }
      );
    }

    const systemInstruction = `You are a world-class LinkedIn Personal Branding Expert.
Your job is to transform the provided Resume Context into ONE powerful flagship LinkedIn personal brand post.

MASTER POST RULES:
${LENGTH_RULES.RESUME}
Combine the Personal Journey, Key Projects, Learnings, Certifications, and Achievements into ONE powerful flagship narrative.

${ANTI_HALLUCINATION}

${BASE_FORMATTING_RULES}`;

    const prompt = `Generate a flagship LinkedIn post based on my resume.
The post must naturally integrate my Personal Journey, Key Projects, Learnings, Certifications, Achievements, and Future Goals into a cohesive, engaging narrative.

Ensure a seamless flow. Use emojis, short paragraphs, and a powerful narrative style.
Resume context:
${cleanText(typeof resumeContext === 'string' ? resumeContext : JSON.stringify(resumeContext))}`;

    const t1 = performance.now();
    console.log(`[Master Post API] Prompt setup took ${t1 - t0}ms. Starting single generation...`);
    
    const generatedPost = await generateAIContent('resume-master-post', prompt, systemInstruction);
    
    const t2 = performance.now();
    console.log(`[Master Post API] Generation took ${t2 - t1}ms.`);

    const t5 = Date.now();
    console.log(`[Master Post API] Total API processing time: ${t5 - t0}ms`);

    return NextResponse.json({ post: generatedPost });

  } catch (error: any) {
    console.error('Master Post Generator API Error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t generate the master post. Please try again.' },
      { status: 500 }
    );
  }
}
