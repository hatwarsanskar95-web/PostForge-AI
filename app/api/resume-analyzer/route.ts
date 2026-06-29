import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { cleanText, ANTI_HALLUCINATION } from '@/lib/ai/prompts';
import mammoth from 'mammoth';

export const maxDuration = 90;

/**
 * Robustly extracts a JSON object from an AI response string.
 */
function extractJsonFromText(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

export async function POST(req: Request) {
  console.log('\n[RESUME-ANALYZER] ===== NEW REQUEST =====');
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    const t0 = performance.now();
    console.log(`[RESUME-ANALYZER] Step 1 - File: ${file ? `name=${file.name}, size=${file.size}, type="${file.type}"` : 'NULL'}`);

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      console.log(`[RESUME-ANALYZER] Step 2 FAIL - File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'File size must be less than 100MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    console.log(`[RESUME-ANALYZER] Step 2 - Extracting text. MIME="${mimeType}", fileName="${fileName}"`);

    try {
      if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
        console.log(`[RESUME-ANALYZER] Step 2 - Using pdf-parse`);
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const data = await pdfParse(buffer);
        extractedText = data.text;
        console.log(`[RESUME-ANALYZER] Step 2 - pdf-parse OK. Extracted ${extractedText.length} chars`);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        console.log(`[RESUME-ANALYZER] Step 2 - Using mammoth for DOCX`);
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        console.log(`[RESUME-ANALYZER] Step 2 - mammoth DOCX OK. Extracted ${extractedText.length} chars`);
      } else if (
        mimeType === 'application/msword' ||
        fileName.endsWith('.doc')
      ) {
        console.log(`[RESUME-ANALYZER] Step 2 - Using mammoth for DOC`);
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        console.log(`[RESUME-ANALYZER] Step 2 - mammoth DOC OK. Extracted ${extractedText.length} chars`);
      } else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
        console.log(`[RESUME-ANALYZER] Step 2 - Reading as plain text`);
        extractedText = buffer.toString('utf-8');
        console.log(`[RESUME-ANALYZER] Step 2 - TXT OK. Extracted ${extractedText.length} chars`);
      } else {
        console.log(`[RESUME-ANALYZER] Step 2 FAIL - Unsupported type: MIME="${mimeType}", name="${fileName}"`);
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.' },
          { status: 400 }
        );
      }
    } catch (extractError: any) {
      console.error(`[RESUME-ANALYZER] Step 2 FAIL - Extraction threw: "${extractError.message}"`);
      console.error('[RESUME-ANALYZER] Extract error:', extractError);
      return NextResponse.json(
        { error: 'Unable to process the uploaded file. Please try again.' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.error(`[RESUME-ANALYZER] Step 3 FAIL - Empty extracted text`);
      return NextResponse.json(
        { error: 'Unable to process the uploaded file. Please ensure it is a text-based document and try again.' },
        { status: 400 }
      );
    }
    
    const tPrep = performance.now();
    console.log(`[RESUME-ANALYZER] File parsing took ${tPrep - t0}ms`);

    const textToAnalyze = cleanText(extractedText);
    console.log(`[RESUME-ANALYZER] Step 3 - Text OK. Using cleaned ${textToAnalyze.length} chars for analysis.`);

    const systemInstruction = `You are a world-class LinkedIn Personal Branding Expert.
Analyze the provided resume text and extract key content opportunities.

CRITICAL REQUIREMENT: Output EXACTLY in the following JSON format. Do not add markdown outside the JSON block.

{
  "insights": {
    "strengths": ["..."],
    "personalBrandingSuggestions": ["..."]
  },
  "categories": [
    {
      "categoryName": "Projects", // e.g. Projects, Experience, Skills, Education
      "ideas": [
        "What building [Project] taught me",
        "My biggest challenge at [Company]"
      ]
    }
  ]
}

${ANTI_HALLUCINATION}
* Use ONLY information from the resume.
* Generate exactly 10 post ideas across relevant categories. KEEP IDEAS VERY SHORT (1 sentence max).`;

    const userPrompt = `Here is the resume text to analyze:\n\n${textToAnalyze}`;

    const t1 = performance.now();
    console.log(`[RESUME-ANALYZER] Prompt build took ${t1 - tPrep}ms`);
    console.log(`[RESUME-ANALYZER] Step 4 - Calling AI API...`);

    let responseText: string;
    try {
      responseText = await generateAIContent('resume-analyzer', userPrompt, systemInstruction);
      const t2 = performance.now();
      console.log(`[RESUME-ANALYZER] AI API Request took ${t2 - t1}ms`);
      console.log(`[RESUME-ANALYZER] Step 5 - AI responded. Length: ${responseText?.length ?? 0}`);
      console.log(`[RESUME-ANALYZER] Step 5 - RAW AI RESPONSE (first 500 chars):\n${(responseText ?? '').substring(0, 500)}`);
    } catch (aiError: any) {
      console.error(`[RESUME-ANALYZER] Step 5 FAIL - AI threw: "${aiError.message}"`);
      console.error(`[RESUME-ANALYZER] Full AI error:`, aiError);
      return NextResponse.json(
        { error: 'We couldn\'t analyze the resume. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[RESUME-ANALYZER] Step 6 - Parsing JSON response...`);
    let result;
    try {
      const cleanedJson = extractJsonFromText(responseText);
      console.log(`[RESUME-ANALYZER] Step 6 - Cleaned JSON (first 200): ${cleanedJson.substring(0, 200)}`);
      result = JSON.parse(cleanedJson);
      console.log(`[RESUME-ANALYZER] Step 6 - JSON parse OK. Categories: ${result?.categories?.length ?? 'N/A'}`);
    } catch (e: any) {
      console.error(`[RESUME-ANALYZER] Step 6 FAIL - JSON parse error: "${e.message}"`);
      console.error(`[RESUME-ANALYZER] Full raw response that failed to parse:\n${responseText}`);
      return NextResponse.json(
        { error: 'We couldn\'t process the AI response. Please try analyzing your resume again.' },
        { status: 500 }
      );
    }

    console.log(`[RESUME-ANALYZER] Step 6 - SUCCESS. Returning data.`);
    console.log(`[RESUME-ANALYZER] Total processing time: ${performance.now() - t0}ms`);
    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error('[RESUME-ANALYZER] UNCAUGHT ERROR:', error.message);
    console.error('[RESUME-ANALYZER] Full error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t analyze the resume. Please try again.' },
      { status: 500 }
    );
  }
}
