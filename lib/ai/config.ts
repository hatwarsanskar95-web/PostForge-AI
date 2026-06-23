export const AI_CONFIG = {
  PROVIDER: process.env.AI_PROVIDER || 'bluesmind',
  ACTIVE_MODEL: process.env.AI_MODEL || 'gemini-3-flash',
  BLUESMIND_API_KEY: process.env.BLUESMIND_API_KEY || '',
  BLUESMIND_BASE_URL: process.env.BLUESMIND_BASE_URL || 'https://api.bluesmind.com/v1',
  
  // Feature Models
  POST_GENERATOR_MODEL: process.env.POST_GENERATOR_MODEL || process.env.AI_MODEL || 'kimi-k2.5',
  CONTENT_IMPROVER_MODEL: process.env.CONTENT_IMPROVER_MODEL || process.env.AI_MODEL || 'kimi-k2.5',
  ACHIEVEMENT_MODEL: process.env.ACHIEVEMENT_MODEL || process.env.AI_MODEL || 'kimi-k2.5',
  CASE_STUDY_MODEL: process.env.CASE_STUDY_MODEL || process.env.AI_MODEL || 'kimi-k2.5',
  RESUME_MODEL: process.env.RESUME_MODEL || 'gpt-5.5',
  IMAGE_MODEL: process.env.IMAGE_MODEL || 'gpt-5.5',
};
