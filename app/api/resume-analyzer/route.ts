import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import mammoth from 'mammoth';

export const maxDuration = 90;

/**
 * Robustly extracts a JSON object from an AI response string.
 * Handles cases where the AI wraps its output in markdown code fences
 * or adds extra text before/after the JSON block.
 */
function extractJsonFromText(text: string): string {
  // 1. Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  // 2. Find the first { and last } to extract the JSON block directly
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }

  // 3. Return the text as-is and let JSON.parse handle the error
  return text.trim();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 100MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (
      mimeType === 'application/msword' ||
      fileName.endsWith('.doc')
    ) {
      // mammoth supports both .doc and .docx formats
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Unable to process the uploaded file. Please ensure it is a text-based document and try again.' },
        { status: 400 }
      );
    }

    // Truncate text drastically to prevent proxy timeout
    const textToAnalyze = extractedText.substring(0, 4000);

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

ANTI-HALLUCINATION RULES:
* NEVER invent metrics, companies, or facts.
* Use ONLY information from the resume.
* Generate exactly 10 post ideas across relevant categories. KEEP IDEAS VERY SHORT (1 sentence max).`;

    const userPrompt = `Here is the resume text to analyze:\n\n${textToAnalyze}`;

    const responseText = await generateAIContent(
      'resume-analyzer',
      userPrompt,
      systemInstruction,
      undefined,
      1500, // Cap JSON output — resume analysis is bounded
    );

    let result;
    try {
      const cleanedJson = extractJsonFromText(responseText);
      result = JSON.parse(cleanedJson);
    } catch (e) {
      console.error('[Resume Analyzer] Failed to parse JSON response. Raw response:', responseText);
      return NextResponse.json(
        { error: 'We couldn\'t process the AI response. Please try analyzing your resume again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error('Resume Analyzer API Error:', error);
    return NextResponse.json(
      { error: 'Unable to process the uploaded file. Please try again.' },
      { status: 500 }
    );
  }
}
