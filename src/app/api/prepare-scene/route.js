import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { global_state, mode, custom_notes, use_director_critique, director_critique } = body;

    console.log("=== PREPARE SCENE INITIATED ===");
    console.log("Mode:", mode);

    let systemPrompt = `You are the Configuration Kernel for the Storybuilder v7.6 Engine. Your task is to update the Level 1-4 narrative state for the upcoming sequence.

=== DIRECTORIAL INSTRUCTIONS ===
`;

    if (custom_notes && custom_notes.trim() !== "") {
      systemPrompt += `CUSTOM DIRECTOR's NOTES: "${custom_notes}"\n`;
      systemPrompt += `CRITICAL RULE: You must prioritize these Custom Notes above all else. Alter the state specifically to achieve these goals.\n\n`;
    }

    if (use_director_critique && director_critique) {
      systemPrompt += `AI DIRECTOR's CRITIQUE: "${director_critique.critique}"\n`;
      systemPrompt += `RECOMMENDED SLIDERS: ${JSON.stringify(director_critique.recommended_slider_adjustments)}\n`;
      systemPrompt += `If the AI Critique conflicts with the Custom Notes, you MUST IGNORE the AI Critique and follow the Custom Notes.\n\n`;
    }

    if (mode === "REWRITE_MODE") {
      systemPrompt += `MODE: REWRITE. You are modifying the state to rewrite the *current* scene. Do not advance locations or time unnecessarily. Adjust sliders, internal friction, and character states to fulfill the notes.\n\n`;
    } else {
      systemPrompt += `MODE: SEQUEL. You are preparing the state for the *next* sequential scene. Update locations, props, friction, and narrative entropy organically based on the trajectory.\n\n`;
    }

    systemPrompt += `=== CURRENT GLOBAL STATE ===\n${JSON.stringify(global_state, null, 2)}\n\n`;
    systemPrompt += `=== v7.14 ENTROPY DETOX: THE NOVELTY CHECK & STRUCTURAL CEILING ===\n`;
    systemPrompt += `Before rendering, you must compare the proposed story structure against the Previous_Story_Log. If the Climax-Resolution geometry (The 'Snap-Break-Exit' sequence) has been used recently, you MUST force a 'Structural Pivot'. You are required to explicitly justify this in the state_change_report. Furthermore, conflicts MUST be fundamentally asymmetrical (e.g., social manipulation, escaping a localized threat, scavenging for survival). The magical "reset" explosion is permanently banned. The resolution cannot be a sudden environment-clearing flash of light.\n\n`;
    systemPrompt += `=== v7.10 METAPHOR QUARANTINE (DOMAIN-LOCKED LEXICON) ===\n`;
    systemPrompt += `You must actively analyze the current level_2_domain (Setting). You are strictly forbidden from using generic metaphysical metaphors like 'void', 'obsidian', 'snapping threads', or 'thin ice'. You must generate a lexicon_mandate defining exactly what physical/environmental textures the engine is allowed to use for metaphorical language based ONLY on the current setting (e.g., if on a train, metaphors must be industrial/steam-based).\n\n`;
    systemPrompt += `=== v7.11 ACTIVE BYSTANDER PROTOCOL ===\n`;
    systemPrompt += `Secondary characters cannot simply stand and react. Every character you include in the scene MUST be assigned a physical task, a conflicting goal, or an interaction with a prop. You must explicitly declare what each secondary character is physically doing in the secondary_character_agency field of the state_change_report.\n\n`;
    systemPrompt += `Based on the instructions and the current state, output an updated JSON state containing level_1_kernel, level_2_domain, level_3_actor_cards, and a state_change_report. Retain any data that shouldn't change. You MUST output a complete, valid JSON object matching the exact schema provided.`;

    const configSchema = {
      type: SchemaType.OBJECT,
      properties: {
        level_1_kernel: {
          type: SchemaType.OBJECT,
          properties: {
            narrative_entropy_index: { type: SchemaType.NUMBER, description: "0 to 10" },
            user_agency_regulator: { type: SchemaType.STRING, description: "automated | hybrid | manual" },
            progression_termination_mode: { type: SchemaType.STRING, description: "fixed_grids | organic_convergence | bounded_range" },
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
          required: ["narrative_entropy_index", "user_agency_regulator", "progression_termination_mode", "target_episode_count", "scope_valve", "protagonist_distribution_mode", "structural_rhythm_preset", "ending_payload_controller", "dialectic_matrix"]
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
            worldbuilding_reasoning: { type: SchemaType.STRING, description: "Your explicit reasoning for the changes." },
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
            chekhov_vault_ledger: { 
              type: SchemaType.ARRAY, 
              items: { 
                type: SchemaType.OBJECT, 
                properties: { 
                  id: { type: SchemaType.STRING }, 
                  description: { type: SchemaType.STRING }, 
                  narrative_classification: { type: SchemaType.STRING },
                  force_payoff: { type: SchemaType.BOOLEAN }, 
                  locked: { type: SchemaType.BOOLEAN },
                  causal_status: { type: SchemaType.STRING, description: "Unresolved | Teased | Resolved" },
                  resolution_episode: { type: SchemaType.INTEGER }
                },
                required: ["id", "description", "narrative_classification", "force_payoff", "locked", "causal_status", "resolution_episode"]
              }
            }
          },
          required: ["dictionary_cascade", "hegemony_node", "active_viewport_box", "worldbuilding_reasoning", "location_ledger", "environmental_props", "chekhov_vault_ledger"]
        },
        level_3_actor_cards: {
          type: SchemaType.OBJECT,
          properties: {
            symbiotic_links: {
              type: SchemaType.ARRAY,
              description: "Array of character names that share a symbiotic bond (0 relational friction)",
              items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            pov_characters: {
              type: SchemaType.ARRAY,
              description: "Fully fleshed out POV characters with deep psychological matrices.",
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
                  desire_inversion_active: { type: SchemaType.BOOLEAN },
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
                required: ["character_id", "the_shield", "the_blueprint", "four_axis_friction_matrix", "kinesic_profile", "three_tier_desire_stack", "desire_inversion_active", "inventory"]
              }
            },
            proxy_npcs: {
              type: SchemaType.ARRAY,
              description: "Flattened NPC schema for minor characters (Name, Faction Loyalty, Current Objective). Prevents bloat.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  character_id: { type: SchemaType.STRING },
                  the_shield: { type: SchemaType.STRING, description: "Character Name" },
                  faction_loyalty: { type: SchemaType.STRING },
                  current_objective: { type: SchemaType.STRING }
                },
                required: ["character_id", "the_shield", "faction_loyalty", "current_objective"]
              }
            }
          },
          required: ["symbiotic_links", "pov_characters", "proxy_npcs"]
        },
        state_change_report: {
          type: SchemaType.OBJECT,
          properties: {
            novelty_check: { type: SchemaType.STRING, description: "Explicit statement: 'This climax breaks the previous template because...'" },
            character_agency: { type: SchemaType.STRING, description: "Explicit statement: 'The character's agency is preserved because...'" },
            resolution_earned: { type: SchemaType.STRING, description: "Explicit statement: 'The resolution is earned by [Character Action] rather than [Object/Magic].'" },
            visual_evidence: { type: SchemaType.STRING, description: "Explicitly highlight the visual, filmable evidence for any internal psychological states." },
            lexicon_mandate: { type: SchemaType.STRING, description: "Explicit list of allowed metaphorical domains and banned cliches based on the level_2_domain." },
            secondary_character_agency: { type: SchemaType.STRING, description: "Explicit list of physical tasks or active goals assigned to any secondary characters in the scene." },
            kinetic_struggle_check: { type: SchemaType.STRING, description: "Explicit statement of the physical pushback, environmental friction, or stamina drain the protagonist faces in the climax." }
          },
          required: ["novelty_check", "character_agency", "resolution_earned", "visual_evidence", "lexicon_mandate", "secondary_character_agency", "kinetic_struggle_check"]
        }
      },
      required: ["level_1_kernel", "level_2_domain", "level_3_actor_cards", "state_change_report"]
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: configSchema,
      }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Preparation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
