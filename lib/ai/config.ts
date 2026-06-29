export const AI_CONFIG = {
  get PROVIDER() { return process.env.AI_PROVIDER || 'openrouter'; },
  get ACTIVE_MODEL() { return process.env.AI_MODEL as string; },
  get FALLBACK_MODEL() { return process.env.FALLBACK_MODEL as string; },
  get OPENROUTER_API_KEY() { return process.env.OPENROUTER_API_KEY || ''; },
  get OPENROUTER_BASE_URL() { return process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'; },
  
  // Feature Models
  get POST_GENERATOR_MODEL() { return (process.env.POST_GENERATOR_MODEL || process.env.AI_MODEL) as string; },
  get CONTENT_IMPROVER_MODEL() { return (process.env.CONTENT_IMPROVER_MODEL || process.env.AI_MODEL) as string; },
  get ACHIEVEMENT_MODEL() { return (process.env.ACHIEVEMENT_MODEL || process.env.AI_MODEL) as string; },
  get CASE_STUDY_MODEL() { return (process.env.CASE_STUDY_MODEL || process.env.AI_MODEL) as string; },
  get RESUME_MODEL() { return (process.env.RESUME_MODEL || process.env.AI_MODEL) as string; },
  get IMAGE_MODEL() { return (process.env.IMAGE_MODEL || process.env.AI_MODEL) as string; },
};
