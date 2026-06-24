import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function POST(request) {
  try {
    const body = await request.json();
    const { episode_text, global_state } = body;

    if (!episode_text || !global_state) {
      return NextResponse.json({ error: "Missing episode_text or global_state" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            pacing_density: { type: SchemaType.NUMBER, description: "Score from 0 to 10" },
            character_realism: { type: SchemaType.NUMBER, description: "Score from 0 to 10" },
            causal_logic: { type: SchemaType.NUMBER, description: "Score from 0 to 10" },
            thematic_resonance: { type: SchemaType.NUMBER, description: "Score from 0 to 10" },
            captivation: { type: SchemaType.NUMBER, description: "Score from 0 to 10" },
            critique: { type: SchemaType.STRING, description: "A highly specific, prescriptive revision plan. Tell the writer exactly what to add, remove, or change (e.g., 'Add 1 more prop interaction, reduce character dialogue, remove the magical resolution')." },
            recommended_slider_adjustments: {
              type: SchemaType.OBJECT,
              properties: {
                pacing_density: { type: SchemaType.NUMBER, description: "Recommended target from 0 to 10" },
                character_realism: { type: SchemaType.NUMBER, description: "Recommended target from 0 to 10" },
                causal_logic: { type: SchemaType.NUMBER, description: "Recommended target from 0 to 10" },
                thematic_resonance: { type: SchemaType.NUMBER, description: "Recommended target from 0 to 10" },
                captivation: { type: SchemaType.NUMBER, description: "Recommended target from 0 to 10" }
              },
              required: ["pacing_density", "character_realism", "causal_logic", "thematic_resonance", "captivation"]
            }
          },
          required: [
            "pacing_density",
            "character_realism",
            "causal_logic",
            "thematic_resonance",
            "captivation",
            "critique",
            "recommended_slider_adjustments"
          ]
        }
      }
    });

    const systemPrompt = `You are an elite, uncompromising Showrunner and Studio Director (e.g., Studio Ghibli, HBO). You are evaluating a freshly generated script. You MUST cross-reference the text with the provided global_state. If pacing is slow, but the state shows it is Episode 2 of a 50-episode saga, that is correct pacing. Do not penalize it. Evaluate the text on 5 metrics (0-10): 1) Pacing Density, 2) Character Realism, 3) Causal Logic, 4) Thematic Resonance, 5) Captivation. Return a strict JSON object containing these 5 scores, a highly prescriptive 'Director's Critique', and a recommended_slider_adjustments object detailing how the user should tune the engine for a rewrite.

=== ANTI-SYCOPHANCY OVERRIDE & GRADING ANCHOR ===
You must entirely suppress standard AI positivity bias. You are an elite, cynical, highly critical Showrunner. You are looking for reasons to REJECT this script. Grade on this strict mathematical curve:

10: An unreachable, flawless masterpiece of human literature. (Do NOT award this).

8-9: Excellent, publishable prose. Gripping, original, and deeply human. This is a very high bar. The pacing must be tight, and the themes must resonate through physical actions.

6-7: A decent draft, but contains typical AI crutches (e.g., purple prose, repetitive sentence structures, or slightly frictionless resolutions).

4-5: Mediocre, formulaic, 'Mad Libs' storytelling. Safe, boring, and predictable. This is your default bucket for average AI writing.

1-3: Broken logic, passive characters, massive narrative debt violations.

Your baseline starting score for any draft is a 4. The text must earn points by demonstrating excellent prose heuristics. Hunt for adjective bloat, redundant dialogue, frictionless victories, and unearned emotional beats. If you see 'Therefore' at the end of a dramatic scene, dock points. An 8 means the text is genuinely excellent and ready for publication.

=== PRESCRIPTIVE CRITIQUE DIRECTIVE ===
Your 'critique' MUST be a highly specific, prescriptive revision plan. You must tell the engine EXACTLY what needs to be changed. State whether the story has too many or too few characters, props, settings, or plot devices. Tell it if the pacing feels too rushed or unnatural. Give actionable, concrete directives (e.g., "Add 1 more physical prop interaction, reduce Finn's dialogue by half, slow down the pacing, remove the magical item drop"). Do not just complain; give strict editorial orders.

=== FRESHLY GENERATED SCRIPT ===
"${episode_text}"

=== GLOBAL STATE ===
${JSON.stringify(global_state, null, 2)}
`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Director evaluation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
