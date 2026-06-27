import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('\n[IMAGE-TO-POST] ===== NEW REQUEST =====');
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const context = formData.get('context') as string || 'Not provided';

    console.log(`[IMAGE-TO-POST] Step 1 - File: ${file ? `name=${file.name}, size=${file.size}, type=${file.type}` : 'NULL'}`);

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded.' }, { status: 400 });
    }

    const mimeType = file.type;
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!validMimeTypes.includes(mimeType)) {
      console.log(`[IMAGE-TO-POST] Step 2 FAIL - Invalid MIME: ${mimeType}`);
      return NextResponse.json(
        { error: 'Unsupported image format. Please upload a JPG, JPEG, PNG, or WEBP image.' },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      console.log(`[IMAGE-TO-POST] Step 2 FAIL - File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'Image size must be less than 50MB.' },
        { status: 400 }
      );
    }

    console.log(`[IMAGE-TO-POST] Step 2 - Validation passed. Reading buffer...`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
    console.log(`[IMAGE-TO-POST] Step 3 - Buffer OK. Base64 length: ${base64Image.length} chars (~${Math.round(base64Image.length / 1024)}KB)`);

    const systemInstruction = `You are a world-class LinkedIn personal branding expert and storytelling strategist.
Task: Analyze the provided professional image and transform it into a premium, engaging LinkedIn post.

IMAGE ANALYSIS PROTOCOL:
* Carefully examine the image for: text, people, objects, environment, logos, certificates, code, setup, presentations, hackathons, or awards.
* Determine the primary category of the image (e.g., Certificate, Project Showcase, Hackathon, Coding Setup, Conference, Award, Team Collaboration, Educational Milestone).

STORYTELLING & FORMATTING RULES:
1. STRONG HOOK: Start with an attention-grabbing hook that relates to the visual content. Do not use boring paragraphs.
2. CONTEXT & STORY: Explain what is happening in the image, but don't just describe it—tell the story behind it.
3. LEARNINGS & INSIGHTS: Extract professional takeaways, lessons learned, or growth moments.
4. EMOJIS & HASHTAGS: Include 3-8 context-relevant emojis and 8-12 relevant hashtags.
5. PARAGRAPH STRUCTURE: Write for mobile. Maximum 1-2 sentences per paragraph. Use bullet points if listing multiple insights.
6. PUNCHY LINES: Include 1-2 memorable, standalone lines.
7. CALL TO ACTION (CTA): End with a meaningful discussion question.

CATEGORY-SPECIFIC GUIDELINES:
* Certificates/Awards: Focus on the journey, what was learned, gratitude, and future goals.
* Project Screenshots: Focus on the problem solved, tech stack, and challenges overcome.
* Hackathons/Teams: Focus on collaboration, time pressure, and building under constraints.
* Coding Setups: Focus on the builder journey, consistency, and growth mindset.
* Events/Conferences: Focus on networking, knowledge sharing, and inspiration.

NEVER INVENT (CRITICAL ANTI-HALLUCINATION):
* NEVER invent specific names, company names, revenue numbers, performance metrics, awards, or statistics unless they are clearly visible in the image or provided in the user's context.
* If the user context is empty, focus heavily on the visual evidence.
* Authenticity > Creativity.

OUTPUT FORMAT:
Generate ONLY the final LinkedIn post text exactly as it should be pasted into LinkedIn. DO NOT include any internal AI labels (e.g., "Hook:", "Story:").`;

    const userPrompt = `Please generate a premium LinkedIn post based on the attached image.
Additional context from the user: ${context}`;

    console.log(`[IMAGE-TO-POST] Step 4 - Calling AI API...`);

    let generatedPost: string;
    try {
      generatedPost = await generateAIContent('image-to-post', userPrompt, systemInstruction, base64Image);
      console.log(`[IMAGE-TO-POST] Step 5 - AI responded. Length: ${generatedPost?.length ?? 0}`);
      console.log(`[IMAGE-TO-POST] Step 5 - RAW RESPONSE (first 300): ${(generatedPost ?? '').substring(0, 300)}`);
    } catch (aiError: any) {
      console.error(`[IMAGE-TO-POST] Step 5 FAIL - AI threw error: "${aiError.message}"`);
      console.error(`[IMAGE-TO-POST] Full AI error stack:`, aiError);
      return NextResponse.json(
        { error: 'We couldn\'t process the AI response. Please regenerate.' },
        { status: 500 }
      );
    }

    if (!generatedPost || generatedPost.trim().length === 0) {
      console.error(`[IMAGE-TO-POST] Step 6 FAIL - Empty response`);
      return NextResponse.json(
        { error: 'We couldn\'t generate a post from this image. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[IMAGE-TO-POST] Step 6 - SUCCESS. Returning post.`);
    return NextResponse.json({ post: generatedPost.trim() });
  } catch (error: any) {
    console.error('[IMAGE-TO-POST] UNCAUGHT ERROR:', error.message);
    console.error('[IMAGE-TO-POST] Full error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t process the AI response. Please regenerate.' },
      { status: 500 }
    );
  }
}
