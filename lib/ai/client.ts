import OpenAI from 'openai';
import { AI_CONFIG } from './config';

// Initialize the OpenAI-compatible client for BluesMind
const aiClient = new OpenAI({
  apiKey: AI_CONFIG.BLUESMIND_API_KEY,
  baseURL: AI_CONFIG.BLUESMIND_BASE_URL,
});

export type AIFeature = 
  | 'post-generator'
  | 'content-improver'
  | 'achievement-generator'
  | 'case-study-forge'
  | 'resume-to-posts'
  | 'resume-analyzer'
  | 'resume-master-post'
  | 'image-to-post';

function getModelForFeature(feature: AIFeature): string {
  switch (feature) {
    case 'post-generator': return AI_CONFIG.POST_GENERATOR_MODEL;
    case 'content-improver': return AI_CONFIG.CONTENT_IMPROVER_MODEL;
    case 'achievement-generator': return AI_CONFIG.ACHIEVEMENT_MODEL;
    case 'case-study-forge': return AI_CONFIG.CASE_STUDY_MODEL;
    case 'resume-to-posts': return AI_CONFIG.RESUME_MODEL;
    case 'resume-analyzer': return AI_CONFIG.RESUME_MODEL;
    case 'resume-master-post': return AI_CONFIG.RESUME_MODEL;
    case 'image-to-post': return AI_CONFIG.IMAGE_MODEL;
    default: return AI_CONFIG.ACTIVE_MODEL;
  }
}

/**
 * Executes the AI generation request with streaming to bypass NGINX idle timeout.
 */
async function executeGeneration(
  model: string,
  prompt: string,
  systemInstruction?: string,
  base64Image?: string,
) {
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  if (base64Image) {
    messages.push({
      role: 'user',
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: base64Image } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  console.log(`[AI-CLIENT] Sending request to model=${model}, hasImage=${!!base64Image}, messagesCount=${messages.length}`);
  const startTime = Date.now();

  // Use streaming internally to bypass the 60-second NGINX idle timeout (504 Gateway Timeout).
  // Note: stream: true must be in the literal call for TypeScript to narrow the return type correctly.
  const stream = await aiClient.chat.completions.create({
    model: model,
    messages: messages,
    stream: true,
  });
  console.log(`[AI-CLIENT] Stream opened successfully (${Date.now() - startTime}ms)`);

  let fullResponse = '';
  let firstTokenTime = null;

  for await (const chunk of stream) {
    if (!firstTokenTime) firstTokenTime = Date.now() - startTime;
    fullResponse += chunk.choices[0]?.delta?.content || '';
  }

  const totalTime = Date.now() - startTime;
  
  // Estimate tokens
  const promptLength = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length), 0);
  const estimatedPromptTokens = Math.ceil(promptLength / 4);
  const estimatedCompletionTokens = Math.ceil(fullResponse.length / 4);

  console.log(`\n======================================`);
  console.log(`🤖 AI GENERATION LOG`);
  console.log(`Model Used:        ${model}`);
  console.log(`Prompt Tokens:     ~${estimatedPromptTokens}`);
  console.log(`Completion Tokens: ~${estimatedCompletionTokens}`);
  console.log(`First Token Time:  ${firstTokenTime}ms`);
  console.log(`Total Time:        ${totalTime}ms`);
  console.log(`======================================\n`);

  return fullResponse;
}

/**
 * Standardized function to generate content using the centralized AI model router.
 * 
 * @param feature The identifier of the feature making the request
 * @param prompt The main prompt/input for the AI
 * @param systemInstruction Optional system instructions to guide the model's behavior
 * @param base64Image Optional base64 encoded image for vision capabilities
 * @returns The generated text response
 */
export async function generateAIContent(
  feature: AIFeature,
  prompt: string,
  systemInstruction?: string,
  base64Image?: string,
) {
  if (!AI_CONFIG.BLUESMIND_API_KEY || AI_CONFIG.BLUESMIND_API_KEY === 'PASTE_MY_BLUESMIND_API_KEY_HERE') {
    throw new Error('BLUESMIND_API_KEY is not configured properly in .env.local.');
  }

  const primaryModel = getModelForFeature(feature);

  try {
    return await executeGeneration(primaryModel, prompt, systemInstruction, base64Image);
  } catch (error: any) {
    console.error(`[AI-CLIENT] PRIMARY MODEL FAILED (${primaryModel}):`);
    console.error(`[AI-CLIENT]   message: ${error.message}`);
    console.error(`[AI-CLIENT]   status:  ${error.status ?? 'N/A'}`);
    console.error(`[AI-CLIENT]   code:    ${error.code ?? 'N/A'}`);
    if (error.response) {
      console.error(`[AI-CLIENT]   response status: ${error.response.status}`);
      try { console.error(`[AI-CLIENT]   response body:   ${JSON.stringify(await error.response.json())}`); } catch {}
    }
    
    const isGPT5 = primaryModel.includes('gpt-5');
    if (isGPT5) {
      console.log(`[AI Client Router] Initiating automatic fallback to kimi-k2.5 for feature ${feature}...`);
      try {
        return await executeGeneration('kimi-k2.5', prompt, systemInstruction, base64Image);
      } catch (fallbackError: any) {
        console.error(`[AI Client Router] Fallback generation also failed:`, fallbackError.message);
        throw createErrorResponse(fallbackError);
      }
    }

    throw createErrorResponse(error);
  }
}

function createErrorResponse(error: any) {
  let errorMessage = error.message || 'Unknown AI generation error';
  
  if (
    errorMessage.includes('504') ||
    errorMessage.includes('Time-out') ||
    errorMessage.includes('Gateway Time-out') ||
    errorMessage.includes('502') ||
    errorMessage.includes('Bad Gateway') ||
    errorMessage.includes('upstream error') ||
    errorMessage.includes('do request failed') ||
    errorMessage.includes('request failed') ||
    errorMessage.includes('upstream') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('fetch failed')
  ) {
    errorMessage = 'We couldn\'t process the AI response. Please regenerate.';
  }

  return new Error(errorMessage);
}
