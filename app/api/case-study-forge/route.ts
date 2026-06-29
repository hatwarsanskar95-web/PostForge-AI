import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { BASE_FORMATTING_RULES, ANTI_HALLUCINATION } from '@/lib/ai/prompts';

export async function POST(req: Request) {
  try {
    const { projectName, techStack, features, challenges, projectLink } = await req.json();

    if (!projectName || !techStack) {
      return NextResponse.json(
        { error: 'Project Name and Tech Stack are required.' },
        { status: 400 }
      );
    }
    const t0 = performance.now();
    console.log(`[CASE-STUDY-FORGE] Validation: ${performance.now() - t0}ms`);

    const systemInstruction = `You are an expert technical storyteller and case study writer.
Task: Convert technical experiences into engaging LinkedIn case studies.

${ANTI_HALLUCINATION}

CONTENT GUIDELINES:
* FEATURE-TO-BENEFIT: Translate features into benefits (e.g. instead of "AI Generator", write "helps users generate content rapidly").
* TECH STACK: Explain why technologies were useful, don't just list them.
* PROJECT LINK: If provided, infer the problem solved and value provided.

${BASE_FORMATTING_RULES}

ADAPTIVE LENGTH:
Match output length to provided information (250-700 words) to avoid filler.
Ensure reader understands: What was built, Why it matters, Challenges, Learnings, and What's next.`;

    const prompt = `Project Name: ${projectName}
Tech Stack: ${techStack}
Core Features: ${features || 'Not provided'}
Challenges & Solution: ${challenges || 'Not provided'}
Project Link: ${projectLink || 'Not provided'}

Write a detailed LinkedIn case study post following the exact guidelines.`;

    const t1 = performance.now();
    console.log(`[CASE-STUDY-FORGE] Prompt Build: ${t1 - t0}ms`);

    const generatedPost = await generateAIContent('case-study-forge', prompt, systemInstruction);
    
    const t2 = performance.now();
    console.log(`[CASE-STUDY-FORGE] API Request & AI Response: ${t2 - t1}ms`);
    console.log(`[CASE-STUDY-FORGE] Total Time: ${t2 - t0}ms`);

    return NextResponse.json({ post: generatedPost.trim() });
  } catch (error: any) {
    console.error('Case Study Forge API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate case study. Please try again later.' },
      { status: 500 }
    );
  }
}
