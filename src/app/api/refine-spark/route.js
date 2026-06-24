import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function POST(request) {
  try {
    const body = await request.json();
    const { raw_spark_text } = body;

    if (!raw_spark_text || raw_spark_text.trim() === "") {
      return NextResponse.json({ error: "No raw spark text provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            refinedPremise: { 
              type: SchemaType.STRING, 
              description: "The elevated, structurally sound, highly compelling Elevator Pitch premise. A single, dense, highly evocative paragraph under 150 words." 
            },
            recommendedEntropyIndex: {
              type: SchemaType.NUMBER,
              description: "Recommended Narrative Entropy Index (1-10). 1 is highly structured/formulaic, 10 is chaotic, surreal, or non-linear."
            }
          },
          required: ["refinedPremise", "recommendedEntropyIndex"]
        }
      }
    });

    const systemPrompt = `You are an elite Hollywood Development Executive. The user will provide a raw, unstructured story idea. Your job is to elevate it into a structurally sound, highly compelling "Elevator Pitch" premise. You must expand on the world-building, clarify the central conflict, and establish a distinct cinematic tone. Keep the output to a single, dense, highly evocative paragraph (under 150 words). 

You must also recommend a 'Narrative Entropy Index' from 1 to 10 based on the tone of the idea:
1-3: Traditional, highly structured, classic hero's journey.
4-6: Grounded but with unexpected twists or complex morality.
7-8: High unpredictability, subversive, non-traditional pacing.
9-10: Avant-garde, surreal, dream-logic, highly chaotic.

Raw unstructured story idea:
"${raw_spark_text}"`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    return NextResponse.json({ success: true, refinedPremise: data.refinedPremise, recommendedEntropyIndex: data.recommendedEntropyIndex });
  } catch (error) {
    console.error("Spark Refiner Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
