import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generates a prompt for an LLM to create comprehensive insights from multiple documents.
 * @param {string} combinedText - The combined text from all documents.
 * @param {string} persona - The persona of the speaker.
 * @param {string} jobTask - The user's goal.
 * @returns {string} The fully formed prompt for the LLM.
 */
function createOverviewInsightsPrompt(combinedText, persona = 'a strategic analyst', jobTask = 'get comprehensive insights from all my documents') {
  return `
You are an expert AI analyst specializing in strategic synthesis and cross-document analysis. Your task is to analyze the collection of documents provided below and generate comprehensive, strategic insights that will help the user achieve their specific goal.

**User Context:**
*   **Persona:** The user identifies as **${persona}**.
*   **Goal:** The user wants to **${jobTask}**.

**Instructions:**

1.  **Role:** Act as a strategic analyst providing high-level, cross-document insights and actionable intelligence.
2.  **Format:** Structure your response in clear sections with strategic insights, key themes, and actionable recommendations.
3.  **Content Analysis:**
    *   **Strategic Overview:** Provide a high-level synthesis of the key themes across all documents.
    *   **Cross-Document Insights:** Identify connections, patterns, and relationships between different documents.
    *   **Key Findings:** Extract 3-5 most important strategic insights that emerge from the entire collection.
    *   **Actionable Intelligence:** Provide specific, actionable recommendations based on the cross-document analysis.
    *   **Strategic Implications:** Explain how these insights impact the user's broader objectives and decision-making.
4.  **Style:** Write in a clear, professional, and strategic manner. Use bullet points and clear headings for easy reading.
5.  **Focus:** Every insight should be directly relevant to helping the user achieve their stated goal through strategic understanding.

**Source Documents to Analyze:**
---
${combinedText}
---

Please provide comprehensive strategic insights now.
  `;
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { persona, jobTask } = await req.json();
    const pdfsDirectory = path.join(process.cwd(), 'public', 'pdfs');
    
    const files = await fs.readdir(pdfsDirectory);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No PDF files found to generate insights.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Encode each PDF as base64 to send directly to Gemini
    let combinedText = '';
    for (const file of pdfFiles) {
      const filePath = path.join(pdfsDirectory, file);
      const dataBuffer = await fs.readFile(filePath);
      const base64Content = dataBuffer.toString('base64');
      combinedText += `
--- Base64 encoded PDF: ${file} ---

${base64Content}`;
    }

    // Generate insights with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = createOverviewInsightsPrompt(combinedText, persona, jobTask);
    const result = await model.generateContent(prompt);
    const insights = await result.response.text();
    
    // Return the insights as JSON
    return new Response(JSON.stringify({ insights }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-overview-insights API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate overview insights.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
