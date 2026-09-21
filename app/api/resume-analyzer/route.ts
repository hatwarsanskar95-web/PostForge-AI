import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import { cleanText, ANTI_HALLUCINATION } from '@/lib/ai/prompts';
import mammoth from 'mammoth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow 2 minutes for deep OCR / multi-page visual extraction

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * Robustly extracts a JSON object from an AI response string.
 */
function extractJsonFromText(text: string): string {
  if (!text) return '{}';
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

/**
 * Validates whether extracted text contains meaningful resume content.
 */
function isMeaningfulText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 100) return false;

  // Check if text has words rather than just binary junk or whitespace
  const words = trimmed.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 15) return false;

  return true;
}

export async function POST(req: Request) {
  console.log('\n[RESUME-ANALYZER] ===== NEW REQUEST =====');
  const t0 = performance.now();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    console.log(`[RESUME-ANALYZER] Step 1 - File: ${file ? `name=${file.name}, size=${file.size}, type="${file.type}"` : 'NULL'}`);

    if (!file || typeof (file as any).arrayBuffer !== 'function' || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded. Please select a resume file.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      console.log(`[RESUME-ANALYZER] Step 2 FAIL - File too large: ${file.size} bytes`);
      return NextResponse.json(
        { success: false, error: 'File size must be 100 MB or less.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();

    let extractedText = '';
    let isScannedOrVisualPdf = false;
    let visualMediaDataUri: string | undefined = undefined;

    const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx');
    const isDoc = mimeType === 'application/msword' || fileName.endsWith('.doc');
    const isTxt = mimeType === 'text/plain' || fileName.endsWith('.txt');
    const isImage = mimeType.startsWith('image/') || fileName.match(/\.(png|jpe?g|webp)$/i);

    if (isPdf) {
      console.log(`[RESUME-ANALYZER] Step 2 - Attempting digital PDF text extraction`);
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const data = await pdfParse(buffer);
        extractedText = data.text || '';
        console.log(`[RESUME-ANALYZER] pdf-parse extracted ${extractedText.length} characters`);
      } catch (parseErr: any) {
        console.warn(`[RESUME-ANALYZER] pdf-parse error: ${parseErr.message}. Will attempt visual OCR fallback.`);
        extractedText = '';
      }

      // Detect whether meaningful text was extracted
      if (!isMeaningfulText(extractedText)) {
        console.log(`[RESUME-ANALYZER] Insufficient text detected (${extractedText.trim().length} chars). Activating multimodal visual/OCR pipeline.`);
        isScannedOrVisualPdf = true;
        visualMediaDataUri = `data:application/pdf;base64,${buffer.toString('base64')}`;
      }
    } else if (isDocx || isDoc) {
      console.log(`[RESUME-ANALYZER] Step 2 - Extracting text using mammoth`);
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
        console.log(`[RESUME-ANALYZER] mammoth extracted ${extractedText.length} characters`);
      } catch (docErr: any) {
        return NextResponse.json(
          { success: false, error: 'Unable to read Word document. Please ensure it is not password protected.' },
          { status: 400, headers: JSON_HEADERS }
        );
      }
      if (!isMeaningfulText(extractedText)) {
        return NextResponse.json(
          { success: false, error: 'The uploaded Word document appears to be empty or contains unreadable text.' },
          { status: 400, headers: JSON_HEADERS }
        );
      }
    } else if (isTxt) {
      extractedText = buffer.toString('utf-8');
      if (!isMeaningfulText(extractedText)) {
        return NextResponse.json(
          { success: false, error: 'The uploaded text file is empty or too short.' },
          { status: 400, headers: JSON_HEADERS }
        );
      }
    } else if (isImage) {
      console.log(`[RESUME-ANALYZER] Image resume uploaded. Processing via visual OCR.`);
      isScannedOrVisualPdf = true;
      const imgMime = mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
      visualMediaDataUri = `data:${imgMime};base64,${buffer.toString('base64')}`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please upload a PDF, DOC, DOCX, TXT, or Image resume.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const systemInstruction = `You are a world-class LinkedIn Personal Branding Expert and Executive Resume Analyst.
Your task is to analyze the candidate's resume (from all pages and sections) and extract high-value content opportunities.

RESUME EXTRACTION PROTOCOL:
- Thoroughly scan all pages, sections, sidebars, headers, and footers.
- Extract key career pillars: Personal Journey, Education, Technical & Soft Skills, Experience, Internships, Key Projects, Certifications, Leadership, Hackathons, Awards, and Quantifiable Achievements.
- Do NOT hallucinate or invent metrics, companies, dates, degrees, or achievements that are not in the resume.
- Normalize and organize all findings.

OUTPUT FORMAT (STRICT JSON):
You MUST output ONLY valid JSON matching this structure:
{
  "insights": {
    "strengths": [
      "Key strength 1 based on actual resume evidence",
      "Key strength 2 based on actual resume evidence",
      "Key strength 3 based on actual resume evidence"
    ],
    "personalBrandingSuggestions": [
      "Branding tip 1 tailored to candidate background",
      "Branding tip 2 tailored to candidate background"
    ]
  },
  "categories": [
    {
      "categoryName": "Projects",
      "ideas": [
        "What building [Specific Project from resume] taught me about [Technical Skill]",
        "Overcoming [Specific Challenge from resume] while creating [Project]"
      ]
    },
    {
      "categoryName": "Experience & Impact",
      "ideas": [
        "Lessons learned while scaling systems at [Company from resume]"
      ]
    },
    {
      "categoryName": "Technical Skills",
      "ideas": [
        "Why mastering [Skill from resume] changed how I approach problem-solving"
      ]
    },
    {
      "categoryName": "Achievements & Milestones",
      "ideas": [
        "The story behind [Achievement/Hackathon/Award from resume]"
      ]
    },
    {
      "categoryName": "Learnings & Career Journey",
      "ideas": [
        "Key transition from [Education/Role] into [Current Specialization]"
      ]
    }
  ]
}

${ANTI_HALLUCINATION}
* Use ONLY facts present in the resume.
* Provide exactly 10 distinct, compelling post ideas distributed across the relevant categories.
* Keep each idea concise (1 sentence max).`;

    let userPrompt: string;
    if (isScannedOrVisualPdf) {
      userPrompt = `Please perform comprehensive visual OCR and analysis on this resume document across all pages. Extract all career highlights, projects, skills, and achievements, and return the structured JSON analysis with 10 post ideas.`;
    } else {
      const textToAnalyze = cleanText(extractedText);
      userPrompt = `Here is the resume text to analyze:\n\n${textToAnalyze}`;
    }

    console.log(`[RESUME-ANALYZER] Calling AI API (Visual=${isScannedOrVisualPdf})...`);
    const tAiStart = performance.now();

    let responseText: string;
    try {
      responseText = await generateAIContent(
        'resume-analyzer',
        userPrompt,
        systemInstruction,
        visualMediaDataUri
      );
      console.log(`[RESUME-ANALYZER] AI responded in ${Math.round(performance.now() - tAiStart)}ms. Response length: ${responseText?.length ?? 0}`);
    } catch (aiError: any) {
      console.error(`[RESUME-ANALYZER] AI call failed: ${aiError.message}`);
      return NextResponse.json(
        { success: false, error: 'We were unable to analyze the resume. Please ensure the document is clear and try again.' },
        { status: 500, headers: JSON_HEADERS }
      );
    }

    let parsedData: any;
    try {
      const cleanedJson = extractJsonFromText(responseText);
      parsedData = JSON.parse(cleanedJson);
      if (!parsedData || !Array.isArray(parsedData.categories)) {
        throw new Error('Invalid JSON schema received from AI');
      }
    } catch (parseError: any) {
      console.error(`[RESUME-ANALYZER] JSON parse failed: ${parseError.message}`);
      return NextResponse.json(
        { success: false, error: 'We could not process the resume analysis. Please try analyzing your resume again.' },
        { status: 500, headers: JSON_HEADERS }
      );
    }

    console.log(`[RESUME-ANALYZER] Successfully analyzed resume in ${Math.round(performance.now() - t0)}ms`);
    return NextResponse.json(
      { success: true, data: parsedData },
      { status: 200, headers: JSON_HEADERS }
    );

  } catch (error: any) {
    console.error('[RESUME-ANALYZER] Uncaught error in route handler:', error.message);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while analyzing the resume. Please try again.' },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
