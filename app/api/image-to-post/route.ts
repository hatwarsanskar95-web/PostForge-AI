import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import sharp from 'sharp';
import { BASE_FORMATTING_RULES, ANTI_HALLUCINATION } from '@/lib/ai/prompts';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('\n[IMAGE-TO-POST] ===== NEW REQUEST =====');
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const context = formData.get('context') as string || 'Not provided';
    const t0 = performance.now();
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
    
    const tPrep0 = performance.now();
    const optimizedBuffer = await sharp(buffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const base64Image = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    const tPrep1 = performance.now();
    
    console.log(`[IMAGE-TO-POST] Image Processing: ${tPrep1 - tPrep0}ms. Original: ${buffer.length}b, Optimized: ${optimizedBuffer.length}b`);

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

${BASE_FORMATTING_RULES}`;

    const userPrompt = `Please generate a premium LinkedIn post based on the attached image.
Additional context from the user: ${context}`;

    const t1 = performance.now();
    console.log(`[IMAGE-TO-POST] Prompt Build: ${t1 - tPrep1}ms`);

    let generatedPost: string;
    try {
      generatedPost = await generateAIContent('image-to-post', userPrompt, systemInstruction, base64Image);
      const t2 = performance.now();
      console.log(`[IMAGE-TO-POST] API Request & AI Response: ${t2 - t1}ms`);
      console.log(`[IMAGE-TO-POST] Step 5 - AI responded. Length: ${generatedPost?.length ?? 0}`);
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

    console.log(`[IMAGE-TO-POST] Total Time: ${performance.now() - t0}ms`);
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
