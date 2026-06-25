import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const ENDING_MODES = ['synthesis', 'tragedy', 'irony', 'hollow_victory'];
const DIALECTIC_FAMILIES = ['man_vs_nature', 'order_vs_chaos', 'freedom_vs_security', 'tradition_vs_progress', 'collectivism_vs_individualism', 'faith_vs_reason'];
const STRUCTURAL_DEVICES = ['linear_escalation', 'in_media_res', 'Rashomon_style', 'temporal_interleaving', 'episodic_vignettes'];

function sampleWeighted(options, recentItems, key) {
  const counts = {};
  options.forEach(opt => counts[opt] = 0);
  recentItems.forEach(item => {
    if (item && item[key] && counts[item[key]] !== undefined) {
      counts[item[key]]++;
    }
  });
  
  // Inverse weighting: weight = 1 / (count + 1)
  const weights = options.map(opt => ({ opt, weight: 1 / (counts[opt] + 1) }));
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const w of weights) {
    if (random < w.weight) return w.opt;
    random -= w.weight;
  }
  return options[0];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { raw_spark_text } = body;

    if (!raw_spark_text || raw_spark_text.trim() === "") {
      return NextResponse.json({ error: "No raw spark text provided" }, { status: 400 });
    }

    // 1. Read fingerprints
    const fingerprintsPath = path.join(process.cwd(), "saved_sagas", "fingerprints.json");
    let recentFingerprints = [];
    if (fs.existsSync(fingerprintsPath)) {
      try {
        const fileData = fs.readFileSync(fingerprintsPath, "utf-8");
        const allFingerprints = JSON.parse(fileData);
        recentFingerprints = allFingerprints.slice(-15);
      } catch (e) {
        console.error("Failed to read fingerprints.json", e);
      }
    } else {
      if (!fs.existsSync(path.dirname(fingerprintsPath))) {
        fs.mkdirSync(path.dirname(fingerprintsPath), { recursive: true });
      }
      fs.writeFileSync(fingerprintsPath, "[]", "utf-8");
    }

    console.log(`Sampling against ${recentFingerprints.length} prior fingerprints`);

    // 2. Sample coordinates weighted against recent usage
    const chosenEnding = sampleWeighted(ENDING_MODES, recentFingerprints, "ending_mode");
    const chosenDialectic = sampleWeighted(DIALECTIC_FAMILIES, recentFingerprints, "dialectic_family");
    const chosenStructure = sampleWeighted(STRUCTURAL_DEVICES, recentFingerprints, "structural_device");

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
            },
            fingerprint: {
              type: SchemaType.OBJECT,
              properties: {
                dialectic_family: { type: SchemaType.STRING },
                ending_mode: { type: SchemaType.STRING },
                protagonist_archetype: { type: SchemaType.STRING },
                setting_class: { type: SchemaType.STRING },
                structural_device: { type: SchemaType.STRING }
              },
              required: ["dialectic_family", "ending_mode", "protagonist_archetype", "setting_class", "structural_device"]
            }
          },
          required: ["refinedPremise", "recommendedEntropyIndex", "fingerprint"]
        }
      }
    });

    let systemPrompt = `You are an elite Hollywood Development Executive. The user will provide a raw, unstructured story idea. Your job is to elevate it into a structurally sound, highly compelling "Elevator Pitch" premise. You must expand on the world-building, clarify the central conflict, and establish a distinct cinematic tone. Keep the output to a single, dense, highly evocative paragraph (under 150 words). 

You must also recommend a 'Narrative Entropy Index' from 1 to 10 based on the tone of the idea:
1-3: Traditional, highly structured, classic hero's journey.
4-6: Grounded but with unexpected twists or complex morality.
7-8: High unpredictability, subversive, non-traditional pacing.
9-10: Avant-garde, surreal, dream-logic, highly chaotic.

=== NOVELTY CONTROLLER ===
To ensure long-term saga diversity, you have been assigned the following structural coordinates for this premise. You MUST build the premise around these concepts. Do NOT invent your own for these three axes:
- ENDING MODE: ${chosenEnding}
- DIALECTIC FAMILY: ${chosenDialectic}
- STRUCTURAL DEVICE: ${chosenStructure}

Additionally, here is a list of recently used fingerprints. For the remaining two axes (protagonist_archetype, setting_class), you MUST choose concepts that differ on >= 3 axes overall from these recent generations to avoid mode-collapse:
${JSON.stringify(recentFingerprints, null, 2)}

Ensure you output the FULL 5-axis fingerprint (including the 3 assigned above) in your JSON response.

Raw unstructured story idea:
"${raw_spark_text}"`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    // 3. Save new fingerprint
    if (data.fingerprint) {
      try {
        let allFingerprints = [];
        if (fs.existsSync(fingerprintsPath)) {
          allFingerprints = JSON.parse(fs.readFileSync(fingerprintsPath, "utf-8"));
        }
        allFingerprints.push(data.fingerprint);
        fs.writeFileSync(fingerprintsPath, JSON.stringify(allFingerprints, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to append fingerprint", e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      refinedPremise: data.refinedPremise, 
      recommendedEntropyIndex: data.recommendedEntropyIndex,
      fingerprint: data.fingerprint 
    });
  } catch (error) {
    console.error("Spark Refiner Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
