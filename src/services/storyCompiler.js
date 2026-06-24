// src/services/storyCompiler.js

export async function compileEpisode(globalState, rewriteConstraints = null, generationMode = "SEQUEL_MODE", customNotes = "", stateChangeReport = null, directorCritique = null) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: globalState, rewrite_constraints: rewriteConstraints, generation_mode: generationMode, custom_notes: customNotes, state_change_report: stateChangeReport, director_critique: directorCritique })
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
