import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { brief_text, global_state } = body;

    console.log("=== INGEST BRIEF INITIATED ===");

    const systemPrompt = `You are the Storybuilder v8.1 Ingestion Engine. Your task is to extract structured narrative elements from the provided Story Brief and map them to our internal state taxonomy.

CRITICAL ENDING DIRECTIVE: You must read the ending HONESTLY. Do not default to 'synthesis'. A tragic, bittersweet, or pyrrhic brief must map to 'tragedy' or 'hollow_victory'. Defaulting to synthesis flattens the intended ending.

Map the brief to the following schema:
- Metaphysical/world laws -> universal_laws_ledger
- Geography / districts -> location_ledger
- Items / tech / grades -> environmental_props
- Character arc matrix -> pov_characters (ghost/lie/desire-stack/friction)
- System phenomena / setups -> chekhov_vault_ledger (with resolution_episode)
- Ending laws -> structural_resolution_frame

Only output elements that are explicitly or strongly implied in the brief. Do not invent filler data.

Story Brief:
"""
${brief_text}
"""
`;

    const configSchema = {
      type: SchemaType.OBJECT,
      properties: {
        universal_laws_ledger: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              rule: { type: SchemaType.STRING },
              consequence: { type: SchemaType.STRING }
            },
            required: ["rule", "consequence"]
          }
        },
        location_ledger: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              location_name: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING }
            },
            required: ["location_name", "description"]
          }
        },
        environmental_props: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              prop_name: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING }
            },
            required: ["prop_name", "description"]
          }
        },
        pov_characters: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              character_id: { type: SchemaType.STRING, description: "Generate a unique ID like 'char_xyz'" },
              the_shield: { type: SchemaType.STRING, description: "Character Name" },
              the_blueprint: {
                type: SchemaType.OBJECT,
                properties: {
                  ghost: { type: SchemaType.STRING },
                  lie: { type: SchemaType.STRING }
                },
                required: ["ghost", "lie"]
              },
              four_axis_friction_matrix: {
                type: SchemaType.OBJECT,
                properties: {
                  axis_1_ideological: { type: SchemaType.NUMBER },
                  axis_2_operational: { type: SchemaType.NUMBER },
                  axis_3_relational: { type: SchemaType.NUMBER },
                  axis_4_existential: { type: SchemaType.NUMBER }
                },
                required: ["axis_1_ideological", "axis_2_operational", "axis_3_relational", "axis_4_existential"]
              },
              kinesic_profile: {
                type: SchemaType.OBJECT,
                properties: {
                  morality_empathy: { type: SchemaType.NUMBER },
                  action_bias: { type: SchemaType.NUMBER },
                  emotional_armor: { type: SchemaType.NUMBER },
                  thematic_alignment: { type: SchemaType.NUMBER },
                  verbal_density: { type: SchemaType.NUMBER }
                },
                required: ["morality_empathy", "action_bias", "emotional_armor", "thematic_alignment", "verbal_density"]
              },
              three_tier_desire_stack: {
                type: SchemaType.OBJECT,
                properties: {
                  macro_want: { type: SchemaType.STRING },
                  meso_want: { type: SchemaType.STRING },
                  micro_want: { type: SchemaType.STRING }
                },
                required: ["macro_want", "meso_want", "micro_want"]
              },
              inventory: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    item_name: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    narrative_status: { type: SchemaType.STRING }
                  },
                  required: ["item_name", "description", "narrative_status"]
                }
              }
            },
            required: ["character_id", "the_shield", "the_blueprint", "four_axis_friction_matrix", "kinesic_profile", "three_tier_desire_stack", "inventory"]
          }
        },
        chekhov_vault_ledger: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING, description: "Generate a unique ID" },
              description: { type: SchemaType.STRING },
              narrative_classification: { type: SchemaType.STRING },
              force_payoff: { type: SchemaType.BOOLEAN },
              locked: { type: SchemaType.BOOLEAN },
              causal_status: { type: SchemaType.STRING },
              resolution_episode: { type: SchemaType.INTEGER }
            },
            required: ["id", "description", "narrative_classification", "force_payoff", "locked", "causal_status", "resolution_episode"]
          }
        },
        structural_resolution_frame: { 
          type: SchemaType.STRING, 
          description: "Must be one of: synthesis, tragedy, irony, hollow_victory" 
        }
      }
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.1, // Low temp for extraction fidelity
        responseMimeType: "application/json",
        responseSchema: configSchema,
      }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });

    const responseText = result.response.text();
    const extractedData = JSON.parse(responseText);

    // Deep Merge Logic
    let newState = JSON.parse(JSON.stringify(global_state));
    let locksToEngage = { ...newState.hybrid_locks };

    // 1. Structural Resolution Frame (Scalar - Overwrite if empty)
    if (extractedData.structural_resolution_frame) {
      if (!newState.level_5_narrative_echo_matrix.synthesis_validator.structural_resolution_frame || newState.level_5_narrative_echo_matrix.synthesis_validator.structural_resolution_frame.includes("|")) {
        newState.level_5_narrative_echo_matrix.synthesis_validator.structural_resolution_frame = extractedData.structural_resolution_frame;
      }
    }

    // 2. Ledgers (Append)
    if (extractedData.universal_laws_ledger && extractedData.universal_laws_ledger.length > 0) {
      newState.level_2_domain.universal_laws_ledger = [
        ...newState.level_2_domain.universal_laws_ledger,
        ...extractedData.universal_laws_ledger
      ];
      locksToEngage.level_2_domain = true;
    }
    
    if (extractedData.location_ledger && extractedData.location_ledger.length > 0) {
      newState.level_2_domain.location_ledger = [
        ...newState.level_2_domain.location_ledger,
        ...extractedData.location_ledger
      ];
      locksToEngage.level_2_domain = true;
    }

    if (extractedData.environmental_props && extractedData.environmental_props.length > 0) {
      newState.level_2_domain.environmental_props = [
        ...newState.level_2_domain.environmental_props,
        ...extractedData.environmental_props
      ];
      locksToEngage.level_2_domain = true;
    }

    if (extractedData.chekhov_vault_ledger && extractedData.chekhov_vault_ledger.length > 0) {
      newState.level_4_vector_engine.chekhov_vault_ledger = [
        ...newState.level_4_vector_engine.chekhov_vault_ledger,
        ...extractedData.chekhov_vault_ledger
      ];
      locksToEngage.level_4_engine = true;
    }

    // 3. Characters (Merge deeply)
    if (extractedData.pov_characters && extractedData.pov_characters.length > 0) {
      // Current pov_characters is an object mapped by ID in the UI, but an array in some schemas. 
      // In the context/schema, level_3_actor_cards.pov_characters is stored as an object { [id]: character }
      const currentPovChars = newState.level_3_actor_cards.pov_characters || {};
      
      extractedData.pov_characters.forEach(newChar => {
        // Look for matching name
        const existingId = Object.keys(currentPovChars).find(
          id => currentPovChars[id].the_shield.toLowerCase() === newChar.the_shield.toLowerCase()
        );

        if (existingId) {
          // Merge
          currentPovChars[existingId] = {
            ...currentPovChars[existingId],
            ...newChar,
            // Preserve deeper structures if needed, though spreading covers top-level objects replacing.
            // For true deep merge:
            the_blueprint: { ...(currentPovChars[existingId].the_blueprint || {}), ...newChar.the_blueprint },
            four_axis_friction_matrix: { ...(currentPovChars[existingId].four_axis_friction_matrix || {}), ...newChar.four_axis_friction_matrix },
            kinesic_profile: { ...(currentPovChars[existingId].kinesic_profile || {}), ...newChar.kinesic_profile },
            three_tier_desire_stack: { ...(currentPovChars[existingId].three_tier_desire_stack || {}), ...newChar.three_tier_desire_stack }
          };
        } else {
          // Append
          const cid = newChar.character_id || 'char_' + Date.now() + Math.random().toString(36).substring(7);
          currentPovChars[cid] = newChar;
        }
      });
      
      newState.level_3_actor_cards.pov_characters = currentPovChars;
      locksToEngage.level_3_actors = true;
    }

    newState.hybrid_locks = locksToEngage;

    return NextResponse.json({
      success: true,
      merged_state: newState
    });

  } catch (error) {
    console.error("Brief Ingestion Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
