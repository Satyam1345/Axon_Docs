import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Buffer } from 'buffer';
import fs from 'fs/promises';
import path from 'path';
// Use pdfjs-dist for reliable PDF text extraction in Node

/**
 * Generates a prompt for an LLM to create a podcast script summarizing multiple documents.
 * @param {string} combinedText - The combined text from all documents.
 * @param {string} persona - The persona of the speaker.
 * @param {string} jobTask - The user's goal.
 * @returns {string} The fully formed prompt for the LLM.
 */
function createOverviewPodcastScriptPrompt(combinedText, persona = 'an insightful analyst', jobTask = 'get a high-level summary of all my documents') {
  return `
You are a world-class podcast scriptwriter specializing in synthesis. Your task is to create a compelling and informative podcast script that provides a high-level overview of the key themes, connections, and main points from the collection of texts provided below.

**User Context:**
*   **Persona:** The user identifies as **${persona}**.
*   **Goal:** The user wants to **${jobTask}**.

**Instructions:**

1.  **Role:** Adopt the persona of an expert analyst providing a strategic overview. Your tone should be authoritative and clear.
2.  **Format:** Structure the output as a podcast script with an intro, main body (covering key themes), and an outro.
3.  **Content:**
    *   **Intro:** Start with a hook that introduces the purpose of the overview.
    *   **Main Body:** Do not just summarize each document one by one. Instead, synthesize the information across all documents. Identify 2-4 major recurring themes, connecting ideas, or contrasting viewpoints. Discuss each theme, drawing examples from the source text.
    *   **Outro:** Provide a concise summary of the main takeaways from the entire collection and a concluding thought.
4.  **Length:** The script should result in a podcast that is approximately **2 to 5 minutes** long.
5.  **Style:** Write in a clear, professional, and conversational style.

**Source Texts to Synthesize:**
---
${combinedText}
---

Please generate the overview podcast script now.
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
