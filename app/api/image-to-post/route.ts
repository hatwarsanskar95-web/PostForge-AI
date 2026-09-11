import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import sharp from 'sharp';
import { BASE_FORMATTING_RULES, ANTI_HALLUCINATION, LENGTH_RULES } from '@/lib/ai/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function POST(req: Request) {
  console.log('\n[IMAGE-TO-POST] ===== NEW REQUEST =====');
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const context = (formData.get('context') as string) || 'Not provided';
    const t0 = performance.now();
    console.log(`[IMAGE-TO-POST] Step 1 - File: ${file ? `name=${file.name}, size=${file.size}, type=${file.type}` : 'NULL'}`);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image uploaded. Please select an image.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const mimeType = file.type || 'image/jpeg';
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!validMimeTypes.includes(mimeType)) {
      console.log(`[IMAGE-TO-POST] Step 2 FAIL - Invalid MIME: ${mimeType}`);
      return NextResponse.json(
        { success: false, error: 'Unsupported image format. Please upload a JPG, JPEG, PNG, or WEBP image.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      console.log(`[IMAGE-TO-POST] Step 2 FAIL - File too large: ${file.size} bytes`);
      return NextResponse.json(
        { success: false, error: 'Image size must be less than 50MB.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    console.log(`[IMAGE-TO-POST] Step 2 - Validation passed. Processing image buffer...`);
    let base64Image: string;
    const tPrep0 = performance.now();

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      base64Image = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
      console.log(`[IMAGE-TO-POST] Sharp Image Processing: ${performance.now() - tPrep0}ms. Original: ${buffer.length}b, Optimized: ${optimizedBuffer.length}b`);
    } catch (sharpError: any) {
      console.warn('[IMAGE-TO-POST] Sharp optimization failed, attempting raw buffer fallback:', sharpError.message);
      try {
        const rawBuffer = Buffer.from(await file.arrayBuffer());
        base64Image = `data:${mimeType};base64,${rawBuffer.toString('base64')}`;
      } catch (fallbackError: any) {
        console.error('[IMAGE-TO-POST] Buffer reading failed:', fallbackError);
        return NextResponse.json(
          { success: false, error: 'Could not read the uploaded image file. Please try again.' },
          { status: 400, headers: JSON_HEADERS }
        );
      }
    }

    const systemInstruction = `You are a world-class LinkedIn personal branding expert and storytelling strategist.
Task: Analyze the provided professional image and transform it into a premium, engaging LinkedIn post.

IMAGE ANALYSIS PROTOCOL:
* Carefully examine the image for: text, people, objects, environment, logos, certificates, code, setup, presentations, hackathons, or awards.
* Determine the primary category of the image.

STORYTELLING RULES:
1. STRONG HOOK: Relates to visual content.
2. CONTEXT & STORY: Tell the story behind the image.
3. LEARNINGS & INSIGHTS: Extract professional takeaways or growth moments.

CATEGORY-SPECIFIC GUIDELINES:
* Certificates/Awards: Focus on the journey, what was learned.
* Project Screenshots: Focus on the problem solved.
* Hackathons/Teams: Focus on collaboration, building under constraints.
* Coding Setups: Focus on builder journey, consistency.
* Events/Conferences: Focus on networking, inspiration.

${ANTI_HALLUCINATION}
* If the user context is empty, focus heavily on the visual evidence.

${LENGTH_RULES.IMAGE}

${BASE_FORMATTING_RULES}`;

    const userPrompt = `Please generate a premium LinkedIn post based on the attached image.
Additional context from the user: ${context}`;

    let generatedPost: string;
    try {
      generatedPost = await generateAIContent('image-to-post', userPrompt, systemInstruction, base64Image);
      console.log(`[IMAGE-TO-POST] Step 5 - AI responded. Length: ${generatedPost?.length ?? 0}`);
    } catch (aiError: any) {
      console.error(`[IMAGE-TO-POST] Step 5 FAIL - AI threw error: "${aiError.message}"`);
      return NextResponse.json(
        { success: false, error: aiError.message || "We couldn't process the AI response. Please regenerate." },
        { status: 500, headers: JSON_HEADERS }
      );
    }

    if (!generatedPost || generatedPost.trim().length === 0) {
      console.error(`[IMAGE-TO-POST] Step 6 FAIL - Empty response`);
      return NextResponse.json(
        { success: false, error: "We couldn't generate a post from this image. Please try again." },
        { status: 500, headers: JSON_HEADERS }
      );
    }

    console.log(`[IMAGE-TO-POST] Total Time: ${performance.now() - t0}ms`);
    return NextResponse.json(
      { success: true, post: generatedPost.trim() },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    console.error('[IMAGE-TO-POST] UNCAUGHT ERROR:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || "We couldn't process the AI response. Please regenerate." },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
