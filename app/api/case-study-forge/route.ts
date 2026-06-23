import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';

export async function POST(req: Request) {
  try {
    const { projectName, techStack, features, challenges, projectLink } = await req.json();

    if (!projectName || !techStack) {
      return NextResponse.json(
        { error: 'Project Name and Tech Stack are required.' },
        { status: 400 }
      );
    }

    const systemInstruction = `You are an expert technical storyteller and case study writer.
Task: Convert technical experiences into engaging LinkedIn case studies.

NEVER INVENT (CRITICAL):
* Revenue, Users, Downloads, Clients, Funding, Metrics, Awards, or Results not provided.
* Do not fill gaps with invented stories. Expand on the reflection and learning process instead.
* Authenticity > Creativity.

CONTENT GUIDELINES:
* FEATURE-TO-BENEFIT: Translate features into benefits (e.g. instead of "AI Generator", write "helps users generate content rapidly").
* TECH STACK: Explain why technologies were useful, don't just list them.
* PROJECT LINK: If provided, infer the problem solved and value provided.

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
Generate only the final LinkedIn post. No internal labels or headers (e.g., no "Hook:").

ADAPTIVE LENGTH:
Match output length to provided information (250-700 words) to avoid filler.
Ensure reader understands: What was built, Why it matters, Challenges, Learnings, and What's next.`;

    const prompt = `Project Name: ${projectName}
Tech Stack: ${techStack}
Core Features: ${features || 'Not provided'}
Challenges & Solution: ${challenges || 'Not provided'}
Project Link: ${projectLink || 'Not provided'}

Write a detailed LinkedIn case study post following the exact guidelines.`;

    const generatedPost = await generateAIContent('case-study-forge', prompt, systemInstruction);

    return NextResponse.json({ post: generatedPost.trim() });
  } catch (error: any) {
    console.error('Case Study Forge API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate case study. Please try again later.' },
      { status: 500 }
    );
  }
}
