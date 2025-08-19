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
You are an expert AI analyst specializing in extracting comprehensive insights and actionable intelligence from text. Your task is to analyze the provided text and generate structured insights that will help the user achieve their specific goal.

**User Context:**
*   **Persona:** The user identifies as **${persona}**.
*   **Goal:** The user wants to **${jobTask}**.

**Instructions:**

Analyze the provided text and structure your response with the following sections:

## 🔑 Key Takeaways
- Identify 3-5 most important insights directly relevant to the user's goal
- Focus on actionable and strategic points

## 💡 "Did You Know?" Facts
- Extract 2-4 surprising, interesting, or lesser-known facts from the content
- Highlight unique insights that might not be immediately obvious

## ⚖️ Contradictions & Counterpoints
- Identify any conflicting information, opposing viewpoints, or areas of debate
- Note limitations, exceptions, or alternative perspectives mentioned

## 📝 Examples & Case Studies
- Extract specific examples, case studies, or practical applications mentioned
- Include concrete instances that illustrate key concepts

## 📊 The "W" Questions Analysis

### 👥 WHO
- Key people, stakeholders, or entities involved
- Target audiences or affected groups

### 📋 WHAT
- Main concepts, processes, or phenomena described
- Core activities or events

### 🤔 WHY
- Underlying reasons, motivations, or causes
- Purpose and rationale behind key points

### ⏰ WHEN
- Timeline, chronology, or temporal aspects
- Critical timing or deadlines mentioned

### 📍 WHERE
- Geographic locations, contexts, or settings
- Spatial or environmental factors

### 🔧 HOW
- Methods, processes, or mechanisms described
- Step-by-step approaches or implementations

## 🎯 Strategic Implications
- How these insights impact the user's broader objectives
- Actionable recommendations based on the analysis

**Style Guidelines:**
- Use clear bullet points and structured formatting
- Write in a professional yet accessible manner
- Every insight should be directly relevant to the user's stated goal
- Include specific references to the source text when possible

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
