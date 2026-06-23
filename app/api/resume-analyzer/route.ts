import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/ai/client';
import mammoth from 'mammoth';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
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
    } else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.' }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from the file. Please ensure it is a text-based document.' }, { status: 400 });
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

    const responseText = await generateAIContent('resume-analyzer', userPrompt, systemInstruction);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON response:", responseText);
      throw new Error("AI returned invalid JSON format.");
    }

    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error('Resume Analyzer API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}
