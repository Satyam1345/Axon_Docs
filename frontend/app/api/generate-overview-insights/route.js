import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { getRuntimeEnv } from '@/app/lib/runtimeEnv';

/**
 * Generates a prompt for an LLM to create comprehensive insights from multiple documents.
 * @param {string} combinedText - The combined text from all documents.
 * @param {string} persona - The persona of the speaker.
 * @param {string} jobTask - The user's goal.
 * @returns {string} The fully formed prompt for the LLM.
 */
function createOverviewInsightsPrompt(combinedText, persona = 'a strategic analyst', jobTask = 'get comprehensive insights from all my documents') {
  return `
You are an expert AI analyst specializing in strategic synthesis and cross-document analysis. Your task is to analyze the collection of documents provided below and generate comprehensive, structured insights that will help the user achieve their specific goal.

**User Context:**
*   **Persona:** The user identifies as **${persona}**.
*   **Goal:** The user wants to **${jobTask}**.

**Instructions:**

Analyze the provided documents and structure your response with the following sections:

## 🔑 Key Takeaways (Cross-Document)
- Identify 3-5 most important strategic insights that emerge from the entire document collection
- Focus on overarching themes and patterns across all materials

## 💡 "Did You Know?" Facts
- Extract 3-5 surprising, interesting, or lesser-known facts from across all documents
- Highlight unique cross-document connections and insights

## ⚖️ Contradictions & Counterpoints
- Identify any conflicting information between documents
- Note different perspectives, debates, or alternative approaches across sources
- Highlight areas where documents complement or contradict each other

## 📝 Examples & Case Studies
- Extract specific examples, case studies, or practical applications from across all documents
- Include concrete instances that illustrate key cross-document themes

## 📊 The "W" Questions Analysis (Cross-Document)

### 👥 WHO
- Key people, stakeholders, or entities mentioned across all documents
- Overlapping or related parties between different sources

### 📋 WHAT
- Main concepts, processes, or phenomena described across the collection
- Core themes and activities that span multiple documents

### 🤔 WHY
- Underlying reasons, motivations, or causes that emerge from the full collection
- Strategic rationale behind key points across sources

### ⏰ WHEN
- Timeline, chronology, or temporal aspects across all documents
- Historical progression or chronological relationships between sources

### 📍 WHERE
- Geographic locations, contexts, or settings mentioned across documents
- Spatial relationships and geographic patterns

### 🔧 HOW
- Methods, processes, or mechanisms described across the document collection
- Best practices and approaches that emerge from multiple sources

## 🎯 Strategic Synthesis & Recommendations
- High-level strategic insights from the entire document collection
- Cross-document patterns and their implications for the user's objectives
- Actionable recommendations based on the comprehensive analysis
- Areas for further investigation or action

## 🔗 Document Relationships
- How different documents relate to each other
- Complementary information and knowledge gaps
- Suggested reading order or focus areas

**Style Guidelines:**
- Use clear bullet points and structured formatting
- Write in a strategic, professional manner
- Focus on cross-document synthesis rather than individual document analysis
- Every insight should be directly relevant to the user's stated goal

**Source Documents to Analyze:**
---
${combinedText}
---

Please provide comprehensive strategic insights now.
  `;
}

const RTE = getRuntimeEnv();
const GEMINI_API_KEY = RTE.GEMINI_API_KEY || RTE.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { persona, jobTask } = await req.json();
  // In Next.js route handlers, process.cwd() resolves to project root inside the container
  // Our Docker image serves static assets from /app/frontend/public
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

    // Optional provider check (we only support gemini)
  const provider = (RTE.LLM_PROVIDER || process.env.LLM_PROVIDER || 'gemini').toLowerCase();
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY/GOOGLE_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (provider !== 'gemini') {
      return new Response(JSON.stringify({ error: `Unsupported LLM_PROVIDER: ${provider}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  const modelName = RTE.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    // Generate insights with Gemini
    const model = genAI.getGenerativeModel({ model: modelName });
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
