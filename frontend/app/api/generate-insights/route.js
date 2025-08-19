import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates a detailed prompt for an LLM to create AI insights from text.
 * @param {string} topicText - The core text or topic for analysis.
 * @param {string} persona - The persona of the user.
 * @param {string} jobTask - The specific job or task the user is trying to accomplish.
 * @returns {string} The fully formed prompt for the LLM.
 */
function createInsightsPrompt(topicText, persona = 'a curious learner', jobTask = 'understand the key insights') {
  return `
You are an expert AI analyst specializing in extracting deep insights and actionable intelligence from text. Your task is to analyze the provided text and generate comprehensive insights that will help the user achieve their specific goal.

**User Context:**
*   **Persona:** The user identifies as **${persona}**.
*   **Goal:** The user wants to **${jobTask}**.

**Instructions:**

1.  **Role:** Act as a strategic analyst providing deep, actionable insights tailored to the user's specific needs and background.
2.  **Format:** Structure your response in clear sections with actionable insights, key takeaways, and strategic recommendations.
3.  **Content Analysis:**
    *   **Key Insights:** Identify 3-5 most important insights from the text that are directly relevant to the user's goal.
    *   **Pattern Recognition:** Look for recurring themes, connections, or underlying principles.
    *   **Actionable Intelligence:** Provide specific, actionable recommendations based on the insights.
    *   **Risk Assessment:** Identify potential challenges or areas that need attention.
    *   **Strategic Implications:** Explain how these insights impact the user's broader objectives.
4.  **Style:** Write in a clear, professional, and insightful manner. Use bullet points and clear headings for easy reading.
5.  **Focus:** Every insight should be directly relevant to helping the user achieve their stated goal.

**Source Text to Analyze:**
---
${topicText}
---

Please provide comprehensive AI insights now.
  `;
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { text, persona, jobTask } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate insights with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = createInsightsPrompt(text, persona, jobTask);
    const result = await model.generateContent(prompt);
    const insights = await result.response.text();
    
    // Return the insights as JSON
    return new Response(JSON.stringify({ insights }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-insights API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate insights.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
