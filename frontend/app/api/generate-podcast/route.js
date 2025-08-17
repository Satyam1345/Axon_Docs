import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Buffer } from 'buffer';

/**
 * Generates a detailed prompt for an LLM to create a podcast script.
 * @param {string} topicText - The core text or topic for the podcast.
 * @param {string} persona - The persona of the speaker (e.g., 'a seasoned financial analyst', 'a tech enthusiast').
 * @param {string} jobTask - The specific job or task the user is trying to accomplish.
 * @returns {string} The fully formed prompt for the LLM.
 */
function createPodcastScriptPrompt(topicText, persona = 'an engaging expert', jobTask = 'understand the key takeaways') {
  return `
You are a world-class podcast scriptwriter. Your task is to create a compelling and informative podcast script based on the provided text, keeping the user's context in mind.

**User Context:**
*   **Persona:** The user identifies as **${persona}**.
*   **Goal:** The user wants to **${jobTask}**.

**Instructions:**

1.  **Role:** Adopt the persona of an expert who is directly addressing someone with the user's persona and goal. Your tone should be authoritative, yet accessible and tailored to their needs.
2.  **Format:** Structure the output as a podcast script. Include an intro, a main body, and an outro. Use clear headings like "[INTRO]", "[MAIN BODY]", and "[OUTRO]".
3.  **Content:**
    *   **Intro:** Start with a catchy hook that speaks to the user's goal. Briefly introduce the topic derived from the text below.
    *   **Main Body:** Analyze the following text and extract the most critical insights that are relevant to the user's goal. Explain them clearly and concisely. Do not just copy sentences; synthesize the information into a natural, spoken-word format.
    *   **Outro:** Summarize the key takeaways and end with a memorable closing statement that helps the user achieve their goal.
4.  **Length:** The script should result in a podcast that is approximately **2 to 5 minutes** long when spoken.
5.  **Style:** Write in a conversational, clear, and professional style. Use short sentences and avoid jargon where possible. The script should be ready to be read aloud by a podcast host.

**Source Text to Analyze:**
---
${topicText}
---

Please generate the podcast script now.
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

    // 1. Generate Script with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = createPodcastScriptPrompt(text, persona, jobTask);
    const result = await model.generateContent(prompt);
    const script = await result.response.text();

    // 2. Convert Script to Speech with Azure TTS
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.NEXT_PUBLIC_AZURE_TTS_KEY, process.env.NEXT_PUBLIC_AZURE_TTS_REGION);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput(); // This is ignored when synthesizing to a buffer

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
    console.error('Error in generate-podcast API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate podcast audio.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
