import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Buffer } from 'buffer';
import fs from 'fs/promises';
import path from 'path';
// Use pdfjs-dist for reliable PDF text extraction in Node

/**
 * Generates a prompt for an LLM to create a two-speaker overview podcast script.
 * @param {string} combinedText - The combined text from all documents.
 * @param {string} persona - The persona of the questioner.
 * @param {string} jobTask - The user's goal.
 * @returns {string} The fully formed prompt for the LLM.
 */
function createOverviewPodcastScriptPrompt(combinedText, persona = 'an insightful analyst', jobTask = 'get a high-level summary of all my documents') {
  return `
You are a world-class podcast scriptwriter specializing in document synthesis. Your task is to create a compelling two-speaker podcast script that provides a comprehensive overview of multiple documents through natural dialogue.

**User Context:**
*   **Persona:** The questioner identifies as **${persona}**.
*   **Goal:** The questioner wants to **${jobTask}**.

**Instructions:**

1.  **Format:** Create a dialogue between two speakers:
    *   **SPEAKER 1 (Questioner):** Someone with the user's persona who asks strategic questions about the document collection
    *   **SPEAKER 2 (Expert Analyst):** A knowledgeable expert who synthesizes information across all documents

2.  **Structure:** 
    *   Start with SPEAKER 1 introducing the purpose and asking about overall themes
    *   Continue with 5-7 strategic questions covering key areas:
        - Main themes across documents
        - Connections and relationships between documents
        - Key insights and patterns
        - Contradictions or different perspectives
        - Practical implications
    *   End with SPEAKER 1 asking for final takeaways

3.  **Content Guidelines:**
    *   DO NOT summarize documents individually
    *   Focus on synthesis across all documents
    *   Identify recurring themes, patterns, and connections
    *   Highlight contrasts and complementary information
    *   Draw strategic insights from the complete collection
    *   Questions should be thoughtful and analysis-focused

4.  **Format Requirements:**
    *   Use "SPEAKER 1:" and "SPEAKER 2:" to clearly distinguish speakers
    *   Write only spoken dialogue - no descriptions, music cues, or production notes
    *   Keep responses comprehensive but conversational (3-4 sentences per answer)
    *   Maintain natural flow between questions and answers

5.  **Length:** The script should result in a 4-6 minute strategic conversation.

6.  **Style:** Professional analytical discussion, accessible language, strategic focus.

**Source Texts to Synthesize:**
---
${combinedText}
---

Generate the two-speaker overview podcast script now, focusing on strategic synthesis and analysis across all documents.
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
      return new Response(JSON.stringify({ error: 'No PDF files found to generate an overview.' }), {
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

    // 1. Generate Script with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = createOverviewPodcastScriptPrompt(combinedText, persona, jobTask);
    const result = await model.generateContent(prompt);
    const script = await result.response.text();

    // 2. Convert Script to Speech with Azure TTS
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_TTS_KEY, process.env.AZURE_TTS_REGION);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    const audioBuffer = await new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        script,
        result => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(Buffer.from(result.audioData));
          } else {
            reject(new Error(result.errorDetails));
          }
          synthesizer.close();
        },
        err => {
          reject(err);
          synthesizer.close();
        }
      );
    });
    
    // 3. Stream the audio back to the client
    return new Response(audioBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error('Error in generate-overview-podcast API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate overview podcast.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
