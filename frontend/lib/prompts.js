/**
 * Generates a detailed prompt for an LLM to create a podcast script.
 * @param {string} topicText - The core text or topic for the podcast.
 * @param {string} persona - The persona of the speaker (e.g., 'a seasoned financial analyst', 'a tech enthusiast').
 * @param {string} jobTask - The specific job or task the user is trying to accomplish.
 * @returns {string} The fully formed prompt for the LLM.
 */
export function createPodcastScriptPrompt(topicText, persona = 'an engaging expert', jobTask = 'understand the key takeaways') {
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
