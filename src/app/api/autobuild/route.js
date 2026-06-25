import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { raw_spark_text, trajectory, entropy_index, world_scale, complexity, fingerprint } = body;

    console.log("=== AUTO-BUILD INITIATED ===");
    console.log("Incoming raw_spark_text:", raw_spark_text);
    console.log("Incoming trajectory:", trajectory);
    console.log("Incoming entropy_index:", entropy_index);
    console.log("Incoming world_scale:", world_scale);
    console.log("Incoming complexity:", complexity);
    const rngSeed = Math.floor(Math.random() * 1000000);
    const motifs = ["Cassette-futurism", "Gothic Western", "Biopunk", "Art Deco Decay", "Brutalist Magic", "Clockwork Horror", "Neon-noir", "Mythic Pastoral", "Industrial Oceanic", "Salvage-punk"];
    const randomMotif = motifs[Math.floor(Math.random() * 10)];
    
    let systemPrompt = `You are the Configuration Kernel for the Storybuilder v8.1 Masterpiece Machine. Generate the engine configuration for the following user premise based on the provided schema.

CRITICAL SYSTEM RULE (v7.13 MULTIDIMENSIONAL SCALING MATRIX): You are an expert Showrunner. Before you populate any arrays, you MUST write a short paragraph in the worldbuilding_reasoning field evaluating the premise across four distinct axes (1-10 scale):
1. Cast Scale: How many distinct perspectives/characters are needed? (e.g. Castaway=1, Game of Thrones=10)
2. Domain Scale: How geographically expansive is the journey? (e.g. Panic Room=1, Lord of the Rings=10)
3. Prop Scale: How many interactive physical items are required for the scene/world?
4. Plot Device Scale: How many core mysteries/catalysts drive the conflict?

Based explicitly on these scores, you must declare exactly how many items to generate per category:
> * If an axis is Intimate (1-3): You must generate 1 to 3 items for that category.
> * If an axis is Standard (4-7): You must generate 4 or 5 items for that category.
> * If an axis is Epic (8-10): You must generate 6 to 9 items for that category.

You MUST bind level_3_actor_cards to the Cast Scale, location_ledger to the Domain Scale, environmental_props to the Prop Scale, and chekhov_vault_ledger to the Plot Device Scale. You are mathematically forbidden from returning empty arrays. You MUST populate the arrays with the exact number of objects you just reasoned were necessary.

CRITICAL CASTING RULE: You must populate level_3_actor_cards with the exact number of fully fleshed-out characters dictated by your Cast Scale. Evaluate the scope, declare the exact cast size needed, and then generate them.

CRITICAL WORLD-BUILDING RULE: Plot devices are narrative engines of conflict. By default, you must scale them organically to match the core genre (cozy stories get intimate devices; epics get macro-forces). HOWEVER, you must actively scan the user's premise for "Intentional Juxtaposition" (e.g., Magical Realism, the mundane mixed with the cosmic). If the premise explicitly combines clashing scales—like a barista dealing with an eldritch god—you MUST lean into the contrast. In these cases, generate a contrasting mix of plot devices (e.g., [Physical: A broken espresso machine] AND [Abstract: A localized tear in the space-time continuum]). Categorize their exact abstract or physical nature in the narrative_classification field. Only enforce strict, uniform genre-matching if the premise is purely one tone.

CRITICAL MYSTERY RULE: You are not required to explain every plot device immediately. If a plot device is a major mystery or catalyst (e.g., an unexplained bomb, a mysterious artifact), assign it causal_status: "Teased" and set a resolution_episode in the future (e.g., Episode 10 or 20). This creates "Narrative Debt" that the story will pay off later.

PROFILE GENERATION RULE: When creating a character, you MUST assign specific 0-10 integers for their 5 kinesic_profile variables. Do not default to 5. You must use Biographical Seeding. Look strictly at the character's generated backstory, trauma, and goals, and mathematically map those traits onto the 5 sliders. Do not artificially force the protagonist and antagonist to be opposites. If two characters naturally have high Action Bias based on their lore, assign them both high numbers. The numbers must perfectly reflect the individual.

THE NOVELTY SEED GENERATOR: You must actively fight "trope looping." Before generating any new scene or configuring this premise, initiate a "Cache Clear" on your environmental and archetype variables. Unless explicitly prompted by the user, you must generate a completely novel combination of Domain (Setting) and Actor Cards (Protagonists) that you have not used in the previous 5 iterations.

THE INFINITE CASTING POOL (v7.11 ARCHETYPE CACHE-WIPE): For every new story execution, the engine must generate 100% novel names, unique physical descriptions, and fresh relationship dynamics. You are STRICTLY FORBIDDEN from generating "Corporate/Bureaucratic Directors" or "Whining/Horrified Locals" unless explicitly requested by the user. You must generate deeply asymmetrical, idiosyncratic personalities instead of generic roles.

For each character, generate 1 to 3 highly specific, thematic props or costume elements in their inventory array. Default their status to "Equipped".

=== FORCED NOVELTY INJECTION ===
Your internal RNG Seed for this generation is: ${rngSeed}.
You must subconsciously tint the aesthetics of this generation with the following randomly assigned motif: ${randomMotif}. Use this purely for aesthetic flavor and distinct physical descriptions, without changing the core genre of the user's premise.

=== AI INTELLIGENCE LAYER: MASTERPIECE ARCHETYPES ===
You must mathematically toggle the Master Levers in the JSON payload based on the premise:
- If Epic Fantasy/Political Drama: Output world_scale = "epic". 
- If Whimsical/Atmospheric (e.g. Studio Ghibli): Output atmospheric_ma_override = true in level_4_vector_engine.
- If Hard Magic/Sci-Fi: Populate the universal_laws_ledger with unbreakable rules.
- If Absurdist/Chaotic (e.g. Chainsaw Man): Set desire_inversion_active = true for the protagonist.
- If Time Loop: Output temporal_iteration_mode = true in level_1_5_saga.
Failure to pull the correct master levers will result in a fatal architectural mismatch.

=== MANUAL-ALIVE CLUSTER INSTRUCTIONS ===
You must configure the following advanced dramatic levers per-premise based on genre and tone reasoning. CRITICAL: NEVER overwrite these levers if their corresponding hybrid_locks are active (e.g., level_1_sliders, level_1_dialectic, level_3_actors).
- level_4_vector_engine.prose_economy_scalar (0-10): Set LOW (<4) for stark, thriller, or minimalist stories; higher for lush/baroque.
- level_4_vector_engine.pov_anchor: Set to a specific character's name for intimate/single-POV premises; use 'Omniscient Objective' ONLY for true ensemble premises.
- level_4_vector_engine.the_dilemma_gate: Set active=true and define a concrete current_dilemma (lose-lose situation) for tragic or political dramas.
- level_4_vector_engine.narrative_perspective_variance: Raise variance_level (>5) for unreliable-narrator or surreal premises.
- level_4_vector_engine.causality_linkage_valve.enforce_therefore_but: Set true for tightly plotted hard-causal dramas (e.g., Game of Thrones, Fullmetal Alchemist).
- level_1_5_saga.global_faction_matrix: Populate with factions and asset_power for epic/political premises (the faction-leverage engine). Leave empty for intimate premises.
- level_1_5_saga.geographical_context_demultiplexer.convergence_override_active and level_1_5_saga.rumor_propagation_queue: Set when the premise implies multi-lane storylines that periodically collide.
- level_2_5_thematic_bridge.thematic_mirroring: Enable (is_active=true, set influence_factor and sync_mode) for atmospheric/literary premises where the environment must mirror internal state.
- level_5_narrative_echo_matrix.synthesis_validator.structural_resolution_frame: Set directly from the sampled ending coordinate tone, do NOT invent freely.

=== DIALECTIC DISTRIBUTION ===
Generated pov_characters MUST occupy OPPOSING POLES of the single shared level_1_kernel.dialectic_matrix. You must stagger their "Lie" (false belief). This means one cast, one argument, multiple stances. Do NOT create parallel solo arcs. This creates the renewable-conflict structure needed for a 50-100 episode saga.`;

    if (world_scale && world_scale !== "AI Default") {
      systemPrompt += `\n\nUSER OVERRIDE: You MUST set the world_scale to "${world_scale}" and explicitly adjust the story scope, location ledger, and plot devices to match this exact scale.`;
    }
    
    if (complexity && complexity !== "AI Default") {
      systemPrompt += `\n\nUSER OVERRIDE: You MUST design the narrative with a "${complexity}" complexity level.`;
      if (complexity === "extreme") systemPrompt += ` Generate an extremely complex web of interwoven plots, massive character rosters across the POV and NPC arrays, and intense political or philosophical friction matrices.`;
      if (complexity === "low") systemPrompt += ` Generate a very straightforward, linear story with a tight focus, very few characters, and simple, direct character motivations.`;
    }

    if (fingerprint) {
      systemPrompt += `\n\n=== STRUCTURAL NOVELTY COORDINATES ===\n`;
      systemPrompt += `You MUST strictly BIND level_1_kernel.dialectic_matrix to the following dialectic family: ${fingerprint.dialectic_family}\n`;
      systemPrompt += `You MUST strictly BIND level_5_narrative_echo_matrix.synthesis_validator.structural_resolution_frame to the following ending mode: ${fingerprint.ending_mode}\n`;
    }

    if (!raw_spark_text || raw_spark_text.trim() === "") {
      systemPrompt += `\n\nThe user has provided NO premise. You have absolute creative freedom. You must invent a brilliant, highly original story premise from scratch. Include this invented premise in the generated_spark field. Then, generate all the Level 1, 2, and 3 settings to perfectly match your new premise. You MUST provide an estimated episode counter in the target_episode_count field based organically on the scale of your invented story (e.g., 1 for a short film, 10 for a mini-series).`;
    } else {
      systemPrompt += `\n\nRaw Story Premise:\n"${raw_spark_text}"`;
    }

    if (trajectory) {
      systemPrompt += `\n\n=== PACING OVERRIDE ===\n`;
      systemPrompt += `You must strictly obey the user's progression termination mode.\n`;
      if (trajectory.mode === "FIXED_GRID") {
        systemPrompt += `The mode is FIXED_GRID. You must spread your Narrative Debt and resolution targets across exactly ${trajectory.target} episodes. Do not default to organic convergence unless explicitly instructed. Output 'fixed_grids' for progression_termination_mode and ${trajectory.target} for target_episode_count.\n`;
        
        if (trajectory.target === 1) {
          systemPrompt += `CRITICAL CONSTRAINT: The user has requested exactly 1 episode (a short film / vignette). You MUST aggressively downscale the Cast Scale and Plot Device Scale. You are FORBIDDEN from generating more than 2 characters and 2 plot devices. A single episode will buckle under too much weight.\n`;
        } else if (trajectory.target <= 3) {
          systemPrompt += `CRITICAL CONSTRAINT: The user has requested a very short run (${trajectory.target} episodes). Keep the Cast Scale and Plot Device Scale low (max 3 characters, max 3 plot devices) to avoid structural bloat.\n`;
        }
      } else if (trajectory.mode === "BOUNDED_RANGE") {
        systemPrompt += `The mode is BOUNDED_RANGE. You must spread your Narrative Debt and resolution targets across between ${trajectory.min} and ${trajectory.max} episodes. Output 'bounded_range' for progression_termination_mode.\n`;
      } else {
        systemPrompt += `The mode is ORGANIC_CONVERGENCE. You must let the story conclude naturally when all narrative debt is resolved. Output 'organic_convergence' for progression_termination_mode.\n`;
      }
    }

    if (entropy_index !== undefined) {
      systemPrompt += `\n\nOutput ${entropy_index} for narrative_entropy_index.\n`;
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
            world_scale: { type: SchemaType.STRING, description: "intimate | standard | epic" },
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
            },
            global_dialogue_density: {
              type: SchemaType.NUMBER,
              description: "0 = dialogue banned BY DESIGN (Seedance lipsync); >0 enables. Keep 0 until lipsync solved."
            },
            scene_register: {
              type: SchemaType.STRING,
              description: "plot | action | rest_beat | ma"
            }
          },
          required: ["world_scale", "narrative_entropy_index", "user_agency_regulator", "progression_termination_mode", "target_episode_count", "scope_valve", "protagonist_distribution_mode", "structural_rhythm_preset", "ending_payload_controller", "dialectic_matrix", "global_dialogue_density", "scene_register"]
        },
        level_1_5_saga: {
          type: SchemaType.OBJECT,
          properties: {
            temporal_iteration_mode: { type: SchemaType.BOOLEAN },
            epistemic_ledger: {
              type: SchemaType.ARRAY,
              description: "The global knowledge ledger. Tracks active secrets, who knows them, and who is ignorant of them.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  secret_id: { type: SchemaType.STRING, description: "e.g., THE_TRUE_HEIR" },
                  description: { type: SchemaType.STRING },
                  known_by: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of character names who know this secret" },
                  ignorant: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of character names who explicitly do NOT know this secret" }
                },
                required: ["secret_id", "description", "known_by", "ignorant"]
              }
            },
            global_faction_matrix: {
              type: SchemaType.OBJECT,
              description: "Factions with asset_power for epic/political premises."
            },
            geographical_context_demultiplexer: {
              type: SchemaType.OBJECT,
              properties: {
                convergence_override_active: { type: SchemaType.BOOLEAN }
              },
              required: ["convergence_override_active"]
            },
            rumor_propagation_queue: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          },
          required: ["temporal_iteration_mode", "epistemic_ledger", "global_faction_matrix", "geographical_context_demultiplexer", "rumor_propagation_queue"]
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
            universal_laws_ledger: {
              type: SchemaType.ARRAY,
              description: "Immutable physics or magic rules of the universe. E.g., 'Human transmutation is impossible'.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  rule: { type: SchemaType.STRING },
                  consequence: { type: SchemaType.STRING, description: "Catastrophic physical cost if broken" }
                },
                required: ["rule", "consequence"]
              }
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
                  locked: { type: SchemaType.BOOLEAN },
                  causal_status: { type: SchemaType.STRING, description: "Unresolved | Teased | Resolved" },
                  resolution_episode: { type: SchemaType.INTEGER, description: "Episode number for reveal, or -1 if never explained" }
                },
                required: ["id", "description", "narrative_classification", "force_payoff", "locked", "causal_status", "resolution_episode"]
              }, 
              description: "Dynamically populated plot devices based on reasoning" 
            }
          },
          required: ["dictionary_cascade", "universal_laws_ledger", "hegemony_node", "active_viewport_box", "worldbuilding_reasoning", "location_ledger", "environmental_props", "chekhov_vault_ledger"]
        },
        level_2_5_thematic_bridge: {
          type: SchemaType.OBJECT,
          properties: {
            thematic_mirroring: {
              type: SchemaType.OBJECT,
              properties: {
                is_active: { type: SchemaType.BOOLEAN },
                influence_factor: { type: SchemaType.NUMBER },
                sync_mode: { type: SchemaType.STRING, description: "passive | aggressive | dissonant" }
              },
              required: ["is_active", "influence_factor", "sync_mode"]
            }
          },
          required: ["thematic_mirroring"]
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
        level_4_vector_engine: {
          type: SchemaType.OBJECT,
          properties: {
            atmospheric_ma_override: { type: SchemaType.BOOLEAN },
            prose_economy_scalar: { type: SchemaType.NUMBER },
            pov_anchor: { type: SchemaType.STRING },
            the_dilemma_gate: {
              type: SchemaType.OBJECT,
              properties: {
                active: { type: SchemaType.BOOLEAN },
                current_dilemma: { type: SchemaType.STRING }
              },
              required: ["active", "current_dilemma"]
            },
            narrative_perspective_variance: {
              type: SchemaType.OBJECT,
              properties: {
                variance_level: { type: SchemaType.NUMBER },
                perception_filter: { type: SchemaType.STRING }
              },
              required: ["variance_level", "perception_filter"]
            },
            causality_linkage_valve: {
              type: SchemaType.OBJECT,
              properties: {
                enforce_therefore_but: { type: SchemaType.BOOLEAN },
                prohibit_and_then: { type: SchemaType.BOOLEAN }
              },
              required: ["enforce_therefore_but", "prohibit_and_then"]
            }
          },
          required: ["atmospheric_ma_override", "prose_economy_scalar", "pov_anchor", "the_dilemma_gate", "narrative_perspective_variance", "causality_linkage_valve"]
        },
        level_5_narrative_echo_matrix: {
          type: SchemaType.OBJECT,
          properties: {
            synthesis_validator: {
              type: SchemaType.OBJECT,
              properties: {
                structural_resolution_frame: { type: SchemaType.STRING }
              },
              required: ["structural_resolution_frame"]
            }
          },
          required: ["synthesis_validator"]
        }
      },
      required: ["level_1_kernel", "level_1_5_saga", "level_2_domain", "level_2_5_thematic_bridge", "level_3_actor_cards", "level_4_vector_engine", "level_5_narrative_echo_matrix"]
    };

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 1.0,
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
