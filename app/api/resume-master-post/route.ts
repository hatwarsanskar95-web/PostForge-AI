import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { cleanText, ANTI_HALLUCINATION } from '@/lib/ai/prompts';

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
1. OUTPUT LENGTH: Flagship deep-dive story, targeting 600-1200 words.
2. OUTPUT STRUCTURE: Flow exactly like this:
   - Strong Hook (visually stands out)
   - Personal Journey & Key Projects
   - Major Learnings, Certifications, & Skills
   - Achievements & Future Goals
   - Powerful Discussion Question
   - 10-15 Relevant Hashtags
3. TONE & STYLE: Use emojis strategically. Maximum 1-2 sentences per paragraph. Convert raw skills into learnings/benefits. Occasional punchy standalone lines.
4. HUMANIZATION: Avoid corporate language. Use a Builder/Founder/Creator voice.

${ANTI_HALLUCINATION}

OUTPUT FORMAT (CRITICAL):
Generate the final LinkedIn post exactly as it should appear when copied and pasted.
DO NOT include any internal AI section labels or formatting headers (e.g., no "Hook:", "Story:", "Key Insight:").`;

    const prompt = `Generate a flagship 600-1200 word LinkedIn post based on my resume.
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
