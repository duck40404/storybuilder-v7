// src/services/storyCompiler.js

export async function compileEpisode(globalState) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: globalState })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to compile episode");
    }

    return data.text;
  } catch (error) {
    console.error("Compiler Service Error:", error);
    throw error;
  }
}
