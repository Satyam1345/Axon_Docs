import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Buffer } from 'buffer';

/**
 * Generates a detailed prompt for an LLM to create a two-speaker podcast script.
 * @param {string} topicText - The core text or topic for the podcast.
 * @param {string} persona - The persona of the questioner (e.g., 'a seasoned financial analyst', 'a tech enthusiast').
 * @param {string} jobTask - The specific job or task the user is trying to accomplish.
 * @returns {string} The fully formed prompt for the LLM.
 */
function createPodcastScriptPrompt(topicText, persona = 'an engaging expert', jobTask = 'understand the key takeaways') {
  return `
You are a world-class podcast scriptwriter. Your task is to create a compelling two-speaker podcast script based on the provided text, featuring a natural question-and-answer conversation.

**User Context:**
*   **Persona:** The questioner identifies as **${persona}**.
*   **Goal:** The questioner wants to **${jobTask}**.

**Instructions:**

1.  **Format:** Create a dialogue between two speakers:
    *   **SPEAKER 1 (Questioner):** Someone with the user's persona who asks thoughtful, engaging questions
    *   **SPEAKER 2 (Expert):** A knowledgeable expert who provides clear, comprehensive answers

2.  **Structure:** 
    *   Start with SPEAKER 1 introducing the topic and asking the first question
    *   Continue with natural back-and-forth dialogue
    *   End with SPEAKER 1 thanking the expert and summarizing key takeaways

3.  **Content Guidelines:**
    *   Extract 4-6 key insights from the source text
    *   Each insight should be explored through a question-answer pair
    *   Questions should be natural and relevant to the user's goal
    *   Answers should be informative, clear, and conversational
    *   No background music, sound effects, or stage directions

4.  **Format Requirements:**
    *   Use "SPEAKER 1:" and "SPEAKER 2:" to clearly distinguish speakers
    *   Write only spoken dialogue - no descriptions, music cues, or production notes
    *   Keep responses concise but informative (2-3 sentences per answer)
    *   Maintain a natural conversational flow

5.  **Length:** The script should result in a 3-5 minute conversation when spoken at normal pace.

6.  **Style:** Professional yet conversational, accessible language, avoid jargon.

**Source Text to Analyze:**
---
${topicText}
---

Generate the two-speaker podcast script now, focusing purely on the dialogue between the questioner and expert.
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
