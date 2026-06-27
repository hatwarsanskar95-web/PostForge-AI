import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';

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

GLOBAL POSTFORGE AI WRITING ENGINE - MASTER POST RULES:
1. OUTPUT LENGTH: The post must be a flagship deep-dive story, targeting 600-1200 words.
2. OUTPUT STRUCTURE: Ensure the post flows exactly like this:
   - Strong Hook (visually stands out)
   - Personal Journey
   - Key Projects
   - Major Learnings
   - Certifications & Skills
   - Achievements
   - Future Goals
   - Powerful Discussion Question
   - 10-15 Relevant Hashtags
3. TITLE STYLE OPENING: The first line must visually stand out (e.g., "🚀 From Learning AI to Building Real Products: My Journey So Far"). Never start with boring paragraphs.
4. EMOJI SYSTEM: Strategically use emojis like 🚀, 💡, 🏆, 🎯, 🛠, 📈, 🔥, ✅. Use them to establish visual hierarchy.
5. MICRO PARAGRAPHS: Maximum 1–2 sentences per paragraph to maintain readability on mobile. Avoid giant text walls.
6. FEATURE HIGHLIGHT MODE: Convert raw skills or projects into learnings/benefits. Do not just list skills. Tell the story behind them.
7. IMPORTANT EMPHASIS: Use occasional punchy standalone lines to increase memorability.
8. HUMANIZATION: Avoid corporate language. Use human observations, personal reflections, real experiences, and a Builder / Founder / Creator voice.
9. ANTI-HALLUCINATION: NEVER invent companies, internships, awards, certifications, revenue, users, achievements, or metrics. Use ONLY information explicitly found in the resume.

OUTPUT FORMAT (CRITICAL):
Generate the final LinkedIn post exactly as it should appear when copied and pasted.
DO NOT include any internal AI section labels or formatting headers (e.g., no "Hook:", "Story:", "Key Insight:").`;

    const promptPart1 = `Generate PART 1 (Hook, Personal Journey, and Key Projects) for a flagship 1000-word LinkedIn post based on my resume.
Use emojis, short paragraphs, and a powerful narrative style. DO NOT include any conclusion or hashtags yet.
Resume context:
${typeof resumeContext === 'string' ? resumeContext : JSON.stringify(resumeContext, null, 2)}`;

    const promptPart2 = `Generate PART 2 (Major Learnings, Certifications, and Achievements) to continue the flagship LinkedIn post.
Make it flow seamlessly from the previous section. Use bullet points and emojis where appropriate.
Resume context:
${typeof resumeContext === 'string' ? resumeContext : JSON.stringify(resumeContext, null, 2)}`;

    const promptPart3 = `Generate PART 3 (Future Goals, a Powerful Discussion Question, and 10-15 Hashtags) to conclude the flagship LinkedIn post.
Resume context:
${typeof resumeContext === 'string' ? resumeContext : JSON.stringify(resumeContext, null, 2)}`;

    const t1 = Date.now();
    console.log(`[Master Post API] Prompt setup took ${t1 - t0}ms. Starting parallel generation for Parts 1, 2, and 3...`);
    
    // Run all 3 parts in parallel
    const [part1, part2, part3] = await Promise.all([
      generateAIContent('resume-master-post', promptPart1, systemInstruction),
      generateAIContent('resume-master-post', promptPart2, systemInstruction),
      generateAIContent('resume-master-post', promptPart3, systemInstruction),
    ]);
    
    const t2 = Date.now();
    console.log(`[Master Post API] Parallel generation of all 3 parts took ${t2 - t1}ms.`);

    const generatedPost = `${part1}\n\n${part2}\n\n${part3}`;

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
