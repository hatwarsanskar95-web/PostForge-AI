import OpenAI from 'openai';
import { AI_CONFIG } from './config';

// Initialize the OpenAI-compatible client for OpenRouter
const aiClient = new OpenAI({
  get apiKey() { return AI_CONFIG.OPENROUTER_API_KEY; },
  get baseURL() { return AI_CONFIG.OPENROUTER_BASE_URL; },
  fetch: async (url, init) => {
    if (!init) return fetch(url, init);
    
    // TASK 4: Log before EVERY OpenRouter request
    const headers = { ...(init.headers as Record<string, string>) };
    if (headers['Authorization']) {
      headers['Authorization'] = 'Bearer [HIDDEN_API_KEY]';
    }
    
    let parsedBody: any = {};
    try {
      if (typeof init.body === 'string') parsedBody = JSON.parse(init.body);
    } catch {}

    console.log('\n==================================================');
    console.log('[OPENROUTER HTTP REQUEST]');
    console.log(`Provider: ${AI_CONFIG.PROVIDER}`);
    console.log(`Endpoint: ${url}`);
    console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
    console.log(`Model: ${parsedBody.model}`);
    console.log(`Temperature: ${parsedBody.temperature ?? 'default'}`);
    console.log(`Max Tokens: ${parsedBody.max_tokens ?? 'default'}`);
    console.log(`Messages: ${JSON.stringify(parsedBody.messages).substring(0, 500)}...`);
    console.log('==================================================\n');

    const response = await fetch(url, init);
    
    // TASK 5: Log immediately after OpenRouter returns
    const resClone = response.clone();
    let rawResponseBody = '';
    try {
      rawResponseBody = await resClone.text();
    } catch (e) {
      rawResponseBody = 'Could not read response body';
    }

    const resHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => { resHeaders[key] = value; });

    console.log('\n==================================================');
    console.log('[OPENROUTER HTTP RESPONSE]');
    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`Headers: ${JSON.stringify(resHeaders, null, 2)}`);
    if (!response.ok) {
      console.error(`Error Body: ${rawResponseBody}`);
    } else {
      console.log(`Raw Response: (Stream/Chunked) or ${rawResponseBody.substring(0, 200)}...`);
    }
    console.log('==================================================\n');

    return response;
  }
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

  console.log(`Provider: ${AI_CONFIG.PROVIDER}`);
  console.log(`Model: ${model}`);
  console.log(`Base URL: ${AI_CONFIG.OPENROUTER_BASE_URL}`);
  console.log(`Endpoint: /chat/completions`);
  console.log(`[AI-CLIENT] Sending request to model=${model}, hasImage=${!!base64Image}, messagesCount=${messages.length}`);
  const startTime = Date.now();

  // Use streaming internally to bypass the 60-second NGINX idle timeout (504 Gateway Timeout).
  // Note: stream: true must be in the literal call for TypeScript to narrow the return type correctly.
  const stream = await aiClient.chat.completions.create({
    model: model,
    messages: messages,
    max_tokens: 3000,
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
  if (!AI_CONFIG.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured properly in .env.local.');
  }

  const primaryModel = getModelForFeature(feature);

  try {
    return await executeGeneration(primaryModel, prompt, systemInstruction, base64Image);
  } catch (error: any) {
    console.error(`[AI-CLIENT] PRIMARY MODEL FAILED (${primaryModel}):`);
    console.error(`[AI-CLIENT]   message: ${error.message}`);
    console.error(`[AI-CLIENT]   status:  ${error.status ?? 'N/A'}`);
    
    // Log detailed failure internally
    createErrorResponse(error, primaryModel);

    // Fallback System
    const fallbackModel = AI_CONFIG.FALLBACK_MODEL;
    if (fallbackModel && fallbackModel !== primaryModel) {
      console.log(`[AI-CLIENT] Retrying with FALLBACK MODEL (${fallbackModel})...`);
      try {
        return await executeGeneration(fallbackModel, prompt, systemInstruction, base64Image);
      } catch (fallbackError: any) {
        console.error(`[AI-CLIENT] FALLBACK MODEL FAILED (${fallbackModel}):`);
        createErrorResponse(fallbackError, fallbackModel);
        throw new Error('AI Generation failed. The provider is currently overloaded or unavailable. Please try again shortly.');
      }
    }
    
    throw new Error('AI Generation failed. The provider is currently overloaded or unavailable. Please try again shortly.');
  }
}

function createErrorResponse(error: any, model: string) {
  const status = error.status || error.response?.status || 'N/A';
  const providerError = error.message || 'Unknown error';
  const requestId = error.headers?.['x-request-id'] || error.response?.headers?.get?.('x-request-id') || 'N/A';
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
- Request ID: ${requestId}
- Raw Response: ${rawResponse}`;

  console.error(detailedError);
  return new Error(detailedError);
}
