import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from './config';

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!AI_CONFIG.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured properly in .env.local.');
    }
    aiClient = new GoogleGenAI({ apiKey: AI_CONFIG.GOOGLE_API_KEY });
  }
  return aiClient;
}

export type AIFeature = 
  | 'post-generator' 
  | 'content-improver'
  | 'achievement-generator'
  | 'case-study-forge'
  | 'resume-master-post'
  | 'resume-to-posts'
  | 'resume-analyzer'
  | 'image-to-post';

function getModelForFeature(feature: AIFeature) {
  const fallback = AI_CONFIG.ACTIVE_MODEL || 'gemini-2.5-flash';
  switch (feature) {
    case 'post-generator': return AI_CONFIG.POST_GENERATOR_MODEL || fallback;
    case 'content-improver': return AI_CONFIG.CONTENT_IMPROVER_MODEL || fallback;
    case 'achievement-generator': return AI_CONFIG.ACHIEVEMENT_MODEL || fallback;
    case 'case-study-forge': return AI_CONFIG.CASE_STUDY_MODEL || fallback;
    case 'resume-master-post':
    case 'resume-to-posts':
    case 'resume-analyzer':
      return AI_CONFIG.RESUME_MODEL || fallback;
    case 'image-to-post': return AI_CONFIG.IMAGE_MODEL || fallback;
    default: return fallback;
  }
}

/**
 * Executes the AI generation request using Google AI Studio.
 */
async function executeGeneration(
  model: string,
  prompt: string,
  systemInstruction?: string,
  base64Media?: string,
  feature?: string
) {
  const contents: any[] = [];
  
  if (base64Media) {
    let data = base64Media;
    let mimeType = 'image/jpeg';
    
    // Parse Data URI if present
    if (base64Media.startsWith('data:')) {
      const parts = base64Media.split(',');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '').replace(';base64', '').trim();
        data = parts[1];
      }
    }
    
    contents.push({
      inlineData: {
        data: data,
        mimeType: mimeType
      }
    });
  }
  
  contents.push(prompt);

  const startTime = Date.now();
  console.log('\n==================================================');
  console.log('[AI GENERATION REQUEST]');
  console.log(`Provider: ${AI_CONFIG.PROVIDER}`);
  console.log(`Model: ${model}`);
  console.log(`Endpoint: Google AI Studio`);
  console.log(`Feature: ${feature}`);
  console.log(`Request Time: ${new Date(startTime).toISOString()}`);
  console.log('==================================================\n');

  try {
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    
    // Use generateContent directly
    const response = await getAiClient().models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    const endTime = Date.now();
    console.log('\n==================================================');
    console.log('[AI GENERATION RESPONSE]');
    console.log(`Status: 200 OK`);
    console.log(`Response Time: ${endTime - startTime}ms`);
    console.log(`Errors: None`);
    console.log('==================================================\n');

    return response.text || '';

  } catch (error: any) {
    const endTime = Date.now();
    console.error('\n==================================================');
    console.error('[AI GENERATION FAILED]');
    console.error(`Status: Error`);
    console.error(`Response Time: ${endTime - startTime}ms`);
    console.error(`Errors: ${error.message || JSON.stringify(error)}`);
    console.error('==================================================\n');
    throw error;
  }
}

export async function generateAIContent(
  feature: AIFeature,
  prompt: string,
  systemInstruction?: string,
  base64Media?: string,
) {
  const primaryModel = getModelForFeature(feature);

  // List of high-performing models in priority order
  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash'
  ])).filter(Boolean);

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      return await executeGeneration(model, prompt, systemInstruction, base64Media, feature);
    } catch (error: any) {
      console.warn(`[AI CLIENT] Model (${model}) failed for ${feature}: ${error.message}. Trying next available fallback model...`);
      lastError = error;
    }
  }

  createErrorResponse(lastError, primaryModel);
  throw new Error('AI Generation service is currently experiencing high demand. Please try again in a few moments.');
}

function createErrorResponse(error: any, model: string) {
  const status = error.status || error.response?.status || 'N/A';
  const providerError = error.message || 'Unknown error';
  
  let rawResponse = 'N/A';
  try {
    if (error.error) {
      rawResponse = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    } else if (error.response?.data) {
      rawResponse = JSON.stringify(error.response.data);
    }
  } catch (e) {
    rawResponse = 'Could not parse response';
  }

  const detailedError = `AI Request Failed:
- HTTP Status: ${status}
- Provider Error: ${providerError}
- Model Used: ${model}
- Raw Response: ${rawResponse}`;

  console.error(detailedError);
}
