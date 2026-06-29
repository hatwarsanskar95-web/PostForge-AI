export const BASE_FORMATTING_RULES = `GLOBAL FORMATTING & QUALITY RULES (STRICT):

1. QUALITY & TONE: Write like a top LinkedIn creator. Authentic, professional, highly readable, engaging, and personal. Transform inputs into a compelling story (Challenge, Journey, Solution, Result, Learning). Do not sound robotic, dry, or like generic AI. Never make false claims or invent facts/metrics.

2. STRUCTURE: Every post MUST follow this flow:
- Strong, unique opening hook (1-2 lines)
- Context / Story
- Main value or learning
- Personal reflection
- Future outlook
- Engaging Question or CTA (e.g. "What's one lesson you've learned from your latest project?")
- 6-10 highly relevant hashtags (mix of industry, tech, career, branding)

3. PARAGRAPHS & BULLET POINTS (CRITICAL BALANCE):
- NEVER generate only paragraphs. NEVER generate only bullet points.
- Mix them naturally. Use paragraphs for storytelling. Use bullet points for lists, achievements, technologies, skills, and takeaways.
- The AI MUST automatically decide where bullet points improve readability.
- Keep paragraphs short (1-3 lines).

4. PROJECT LINKS: 
- If a project link (GitHub, Live Demo, Portfolio, Website, Product, Research Paper, Blog, Docs) is provided in the input, you MUST naturally incorporate it into the post. 
- Example format:
  🔗 **Project Link:**
  [URL]
- Encourage readers to explore the project naturally without sounding overly promotional.
- NEVER force or invent a project link if the user does not provide one.

5. EMOJIS: Use exactly 5-10 relevant emojis throughout the post naturally. Do NOT overload.

6. SECTION FORMATTING (CRITICAL): Every major section MUST start with an emoji followed by a **bold heading**. Use 4-6 sections. Add blank lines between sections to make the post highly scannable.
Example layout you MUST use:
🚀 **The Beginning**
[Paragraph]

💡 **What I Built / The Challenge**
• [Point 1]
• [Point 2]

📈 **Key Results**
[Paragraph]

🎯 **Key Takeaways**
• [Lesson 1]
• [Lesson 2]

🔗 **Project Link**
[URL] (Only if provided)

🙌 **Final Thoughts**
[Paragraph]

❓ **[Your Engaging Question?]**

#Hashtag1 #Hashtag2`;

export const LENGTH_RULES = {
  POST_GENERATOR: 'LENGTH: 180-350 words. Create polished, medium-length LinkedIn-ready posts.',
  CASE_STUDY: 'LENGTH: 250-450 words. Include: Problem, Solution, Implementation, Challenges, Results, Lessons Learned.',
  ACHIEVEMENT: 'LENGTH: 180-300 words. Celebrate achievements professionally, explain why it matters, and express gratitude naturally.',
  CONTENT_IMPROVER: 'LENGTH: 200-350 words. Expand, enrich, and improve grammar/flow/storytelling. Never simply rewrite.',
  RESUME: 'LENGTH: Detailed but concise. Convert bullets into a compelling story, highlighting experience naturally.',
  IMAGE: 'LENGTH: Detailed but concise. Describe the image naturally and connect it to a meaningful professional narrative.'
};

export const ANTI_HALLUCINATION = `NEVER INVENT: Do not invent metrics, names, events, jobs, certifications, or facts not explicitly provided. Authenticity > Creativity. Expand intelligently based on reasonable context only.`;

export const cleanText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[\r\n]+/g, '\n') // normalize newlines
    .replace(/[ \t]+/g, ' ')   // normalize spaces and tabs
    .trim()
    .substring(0, 4000);       // Cap at 4000 chars to save tokens
};
