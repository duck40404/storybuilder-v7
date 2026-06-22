import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { raw_spark_text } = body;

    console.log("=== AUTO-BUILD INITIATED ===");
    console.log("Incoming raw_spark_text:", raw_spark_text);
    
    let systemPrompt = `You are the Configuration Kernel for the Storybuilder v7.3 Narrative Engine. Generate the engine configuration for the following user premise based on the provided schema.

CRITICAL SYSTEM RULE: You are an expert Showrunner. Before you populate any arrays, you MUST write a short paragraph in the worldbuilding_reasoning field. In this paragraph, analyze the premise and explicitly declare exactly how many locations, props, and Chekhov's guns/plot devices are organically required to tell this specific story.
> * For example, write: "This is a locked-room thriller. It organically requires 1 location, 3 props, and 1 plot device." OR "This is a sprawling epic. It requires 5 locations, 4 props, and 3 plot devices."

Once you have declared these numbers in worldbuilding_reasoning, you are MATHEMATICALLY FORBIDDEN from returning empty arrays. You MUST populate location_ledger, environmental_props, and chekhov_vault_ledger with the exact number of objects you just reasoned were necessary.

CRITICAL CASTING RULE: You are a Master Showrunner. Before populating the level_3_actor_cards array, you MUST use the worldbuilding_reasoning paragraph to analyze the premise and declare exactly how many characters are organically required. A contained survival thriller might only need 1 character. A sprawling political epic might organically require 5 to 7 characters. You are mathematically forbidden from defaulting to 2 characters. Evaluate the scope, declare the exact cast size needed, and then populate level_3_actor_cards with that exact number of fully fleshed-out characters.

CRITICAL WORLD-BUILDING RULE: Plot devices are narrative engines of conflict. By default, you must scale them organically to match the core genre (cozy stories get intimate devices; epics get macro-forces). HOWEVER, you must actively scan the user's premise for "Intentional Juxtaposition" (e.g., Magical Realism, the mundane mixed with the cosmic). If the premise explicitly combines clashing scales—like a barista dealing with an eldritch god—you MUST lean into the contrast. In these cases, generate a contrasting mix of plot devices (e.g., [Physical: A broken espresso machine] AND [Abstract: A localized tear in the space-time continuum]). Categorize their exact abstract or physical nature in the narrative_classification field. Only enforce strict, uniform genre-matching if the premise is purely one tone.

For each character, generate 1 to 3 highly specific, thematic props or costume elements in their inventory array. Default their status to "Equipped".`;

    if (!raw_spark_text || raw_spark_text.trim() === "") {
      systemPrompt += `\n\nThe user has provided NO premise. You have absolute creative freedom. You must invent a brilliant, highly original story premise from scratch. Include this invented premise in the generated_spark field. Then, generate all the Level 1, 2, and 3 settings to perfectly match your new premise. You MUST provide an estimated episode counter in the target_episode_count field based organically on the scale of your invented story (e.g., 1 for a short film, 10 for a mini-series).`;
    } else {
      systemPrompt += `\n\nRaw Story Premise:\n"${raw_spark_text}"`;
    }

    const configSchema = {
      type: SchemaType.OBJECT,
      properties: {
        generated_spark: {
          type: SchemaType.STRING,
          description: "Invented story premise if the user provided none."
        },
        level_1_kernel: {
          type: SchemaType.OBJECT,
          properties: {
            entropy_slider: { type: SchemaType.NUMBER, description: "0 to 10" },
            user_agency_regulator: { type: SchemaType.STRING, description: "automated | hybrid | manual" },
            progression_termination_mode: { type: SchemaType.STRING, description: "fixed_grids | organic_convergence" },
            target_episode_count: { type: SchemaType.NUMBER },
            scope_valve: { type: SchemaType.STRING, description: "micro_stakes | macro_stakes" },
            protagonist_distribution_mode: { type: SchemaType.STRING, description: "single_focus | ensemble_round_robin" },
            structural_rhythm_preset: { type: SchemaType.STRING, description: "slow_burn | relentless_compression" },
            ending_payload_controller: { type: SchemaType.STRING, description: "open | closed_finality | closed_loop" },
            dialectic_matrix: {
              type: SchemaType.OBJECT,
              properties: {
                core_claim: { type: SchemaType.STRING },
                counter_claim: { type: SchemaType.STRING },
                thematic_status_node: { type: SchemaType.STRING, description: "equilibrium | confrontation | synthesis" }
              },
              required: ["core_claim", "counter_claim", "thematic_status_node"]
            }
          },
          required: ["entropy_slider", "user_agency_regulator", "progression_termination_mode", "target_episode_count", "scope_valve", "protagonist_distribution_mode", "structural_rhythm_preset", "ending_payload_controller", "dialectic_matrix"]
        },
        level_2_domain: {
          type: SchemaType.OBJECT,
          properties: {
            dictionary_cascade: {
              type: SchemaType.OBJECT,
              properties: {
                tier_1_genre: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                tier_2_aesthetic: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              },
              required: ["tier_1_genre", "tier_2_aesthetic"]
            },
            hegemony_node: {
              type: SchemaType.OBJECT,
              properties: {
                mass_slider: { type: SchemaType.NUMBER }
              },
              required: ["mass_slider"]
            },
            active_viewport_box: {
              type: SchemaType.OBJECT,
              properties: {
                current_location_id: { type: SchemaType.STRING },
                local_container_volume: { type: SchemaType.STRING },
                local_prop_registry: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              },
              required: ["current_location_id", "local_container_volume", "local_prop_registry"]
            },
            worldbuilding_reasoning: { type: SchemaType.STRING, description: "Your explicit reasoning for how many array items are required." },
            location_ledger: { 
              type: SchemaType.ARRAY, 
              items: { 
                type: SchemaType.OBJECT, 
                properties: { 
                  location_name: { type: SchemaType.STRING }, 
                  description: { type: SchemaType.STRING } 
                },
                required: ["location_name", "description"]
              }, 
              description: "Dynamically populated locations based on reasoning" 
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
              }, 
              description: "Dynamically populated props based on reasoning" 
            },
            chekhov_vault_ledger: { 
              type: SchemaType.ARRAY, 
              items: { 
                type: SchemaType.OBJECT, 
                properties: { 
                  id: { type: SchemaType.STRING }, 
                  description: { type: SchemaType.STRING }, 
                  narrative_classification: { type: SchemaType.STRING },
                  force_payoff: { type: SchemaType.BOOLEAN }, 
                  locked: { type: SchemaType.BOOLEAN } 
                },
                required: ["id", "description", "narrative_classification", "force_payoff", "locked"]
              }, 
              description: "Dynamically populated plot devices based on reasoning" 
            }
          },
          required: ["dictionary_cascade", "hegemony_node", "active_viewport_box", "worldbuilding_reasoning", "location_ledger", "environmental_props", "chekhov_vault_ledger"]
        },
        level_3_actor_cards: {
          type: SchemaType.OBJECT,
          properties: {
            directory_ledger: {
              type: SchemaType.ARRAY,
              description: "A dynamic array of character profiles. Size scales organically with story scope.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  character_id: { type: SchemaType.STRING },
                  the_shield: { type: SchemaType.STRING, description: "Character Name" },
                  the_blueprint: {
                    type: SchemaType.OBJECT,
                    properties: {
                      ghost: { type: SchemaType.STRING, description: "Past trauma" },
                      lie: { type: SchemaType.STRING, description: "False belief" }
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
                  three_tier_desire_stack: {
                    type: SchemaType.OBJECT,
                    properties: {
                      macro_want: { type: SchemaType.STRING },
                      meso_want: { type: SchemaType.STRING },
                      micro_want: { type: SchemaType.STRING }
                    },
                    required: ["macro_want", "meso_want", "micro_want"]
                  },
                  kinetic_wave_envelope_modulators: {
                    type: SchemaType.OBJECT,
                    properties: {
                      emotional_inertia_scalar: { type: SchemaType.NUMBER },
                      somatic_charge_velocity: { type: SchemaType.NUMBER },
                      somatic_decay_velocity: { type: SchemaType.NUMBER }
                    },
                    required: ["emotional_inertia_scalar", "somatic_charge_velocity", "somatic_decay_velocity"]
                  },
                  inventory: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        item_name: { type: SchemaType.STRING },
                        description: { type: SchemaType.STRING },
                        narrative_status: { type: SchemaType.STRING, description: "Equipped | Stashed | Lost" }
                      },
                      required: ["item_name", "description", "narrative_status"]
                    }
                  }
                },
                required: ["character_id", "the_shield", "the_blueprint", "four_axis_friction_matrix", "three_tier_desire_stack", "kinetic_wave_envelope_modulators", "inventory"]
              }
            }
          },
          required: ["directory_ledger"]
        }
      },
      required: ["level_1_kernel", "level_2_domain", "level_3_actor_cards"]
    };

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: configSchema,
      }
    });

    // Execute
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });

    // 1. Attempt to resolve the response safely
    const response = await result.response;
    let rawText = "";

    // 2. Universal extraction strategy
    if (response && typeof response.text === 'function') {
        rawText = response.text();
    } else if (response && typeof response.text === 'string') {
        rawText = response.text;
    } else if (response.candidates && response.candidates[0]?.content?.parts && response.candidates[0].content.parts.length > 0 && response.candidates[0].content.parts[0].text) {
        rawText = response.candidates[0].content.parts[0].text;
    } else if (response.content && response.content.parts && response.content.parts.length > 0 && response.content.parts[0].text) {
        rawText = response.content.parts[0].text;
    } else {
        // Log the full response for deep debugging if all else fails
        console.error("Full failed response object:", JSON.stringify(response, null, 2));
        throw new Error("Gemini returned a payload with no readable text path.");
    }

    // 3. Log the extracted text (first 100 chars) to confirm success
    console.log("Successfully extracted text start:", rawText.substring(0, 100));

    let cleanData = rawText;
    // Find the first '{' and the last '}'
    const startIndex = cleanData.indexOf('{');
    const endIndex = cleanData.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
        throw new Error("API returned no JSON. Raw response: " + rawText);
    }

    // Extract strictly the JSON object
    cleanData = cleanData.slice(startIndex, endIndex + 1);

    // Parse the isolated object
    const jsonResult = JSON.parse(cleanData);

    return NextResponse.json(jsonResult);

  } catch (error) {
    console.error("Critical Backend Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
