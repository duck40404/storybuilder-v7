import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function POST(request) {
  try {
    const body = await request.json();
    const { new_text, previous_synopsis } = body;

    if (!new_text) {
      return NextResponse.json({ error: "No new_text provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            immediate_synopsis: { type: SchemaType.STRING, description: "A standalone, immediate summary of ONLY the NEW STORY TEXT events." },
            cumulative_synopsis: { type: SchemaType.STRING, description: "A seamlessly woven summary combining the PREVIOUS SYNOPSIS with the NEW STORY TEXT events." }
          },
          required: ["immediate_synopsis", "cumulative_synopsis"]
        }
      }
    });

    let prompt = `You are a Continuity Editor for a dynamic narrative engine.\n\n`;
    prompt += `You will receive newly generated story text and a previous_synopsis string.\n`;
    prompt += `1. Provide an 'immediate_synopsis' which is a clean, standalone summary of ONLY the new_text.\n`;
    prompt += `2. Provide a 'cumulative_synopsis'. IF the previous_synopsis is empty, this is the same as the immediate_synopsis. IF the previous_synopsis contains text, seamlessly weave the new events into it to create an updated, cumulative summary of the entire saga so far.\n`;
    prompt += `In both summaries, explicitly list the main plot points and any plot devices that were used, stashed, or discovered.\n\n`;

    prompt += `=== PREVIOUS SYNOPSIS ===\n`;
    prompt += previous_synopsis && previous_synopsis.trim() !== "" ? previous_synopsis : "[EMPTY]";
    prompt += `\n\n=== NEW STORY TEXT ===\n`;
    prompt += new_text;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());

    return NextResponse.json({ success: true, immediate: data.immediate_synopsis, cumulative: data.cumulative_synopsis });
  } catch (error) {
    console.error("Synopsis Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
