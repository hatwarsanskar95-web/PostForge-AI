import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { BASE_FORMATTING_RULES, ANTI_HALLUCINATION, LENGTH_RULES } from '@/lib/ai/prompts';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MAX_IMAGE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(req: Request) {
  console.log('\n[IMAGE-TO-POST] ===== NEW REQUEST =====');
  const t0 = performance.now();
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const context = (formData.get('context') as string) || 'Not provided';
    
    console.log(`[IMAGE-TO-POST] Step 1 - File: ${file ? `name=${file.name}, size=${file.size}, type=${file.type}` : 'NULL'}`);

    if (!file || typeof (file as any).arrayBuffer !== 'function' || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No image uploaded. Please select an image.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      console.log(`[IMAGE-TO-POST] Step 2 FAIL - File too large: ${file.size} bytes`);
      return NextResponse.json(
        { success: false, error: 'Image size must be 100 MB or less.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const mimeType = (file.type || 'image/jpeg').toLowerCase();
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!validMimeTypes.includes(mimeType) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      console.log(`[IMAGE-TO-POST] Step 2 FAIL - Invalid MIME: ${mimeType}`);
      return NextResponse.json(
        { success: false, error: 'Unsupported image format. Please upload a JPG, JPEG, PNG, or WEBP image.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    console.log(`[IMAGE-TO-POST] Step 2 - Validation passed. Processing image buffer...`);
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Optimize processing copy using Sharp to ensure sharp text/details and optimal AI payload
    let optimizedBuffer: Buffer;
    let finalMimeType = 'image/jpeg';

    try {
      const imagePipeline = sharp(inputBuffer);
      const metadata = await imagePipeline.metadata();

      // If dimensions are extremely large (>2560px), resize keeping aspect ratio for high-res OCR
      if (metadata.width && metadata.height && (metadata.width > 2560 || metadata.height > 2560)) {
        imagePipeline.resize({
          width: 2560,
          height: 2560,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      if (metadata.format === 'png') {
        optimizedBuffer = await imagePipeline.png({ quality: 90, compressionLevel: 8 }).toBuffer();
        finalMimeType = 'image/png';
      } else if (metadata.format === 'webp') {
        optimizedBuffer = await imagePipeline.webp({ quality: 90 }).toBuffer();
        finalMimeType = 'image/webp';
      } else {
        optimizedBuffer = await imagePipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
        finalMimeType = 'image/jpeg';
      }

      console.log(`[IMAGE-TO-POST] Optimized image: ${inputBuffer.length} bytes -> ${optimizedBuffer.length} bytes (${Math.round(performance.now() - t0)}ms)`);
    } catch (sharpErr: any) {
      console.warn(`[IMAGE-TO-POST] Sharp optimization warning: ${sharpErr.message}. Using fallback buffer.`);
      optimizedBuffer = inputBuffer;
      finalMimeType = mimeType;
    }

    const base64Image = `data:${finalMimeType};base64,${optimizedBuffer.toString('base64')}`;

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
