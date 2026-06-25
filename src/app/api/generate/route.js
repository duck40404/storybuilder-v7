import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { synthesizeDirectorialDirective } from "@/services/kinesicSynthesis";

export async function POST(request) {
  try {
    const body = await request.json();
    const globalState = body.state;
    const rewrite_constraints = body.rewrite_constraints;
    const generation_mode = body.generation_mode || "SEQUEL_MODE";
    const custom_notes = body.custom_notes || "";
    const state_change_report = body.state_change_report || null;
    const director_critique = body.director_critique || null;
    
    if (!globalState) {
      return NextResponse.json({ error: "Missing global state" }, { status: 400 });
    }

    const {
      level_1_kernel: kernel,
      level_2_domain: domain,
      level_2_5_thematic_bridge: bridge,
      level_3_actor_cards: actors,
      level_4_vector_engine: engine
    } = globalState;

    const sceneRegister = kernel?.scene_register || (engine?.atmospheric_ma_override ? 'ma' : 'plot');

    const genre = domain?.dictionary_cascade?.tier_1_genre?.join(", ") || "generic";
    const aesthetic = domain?.dictionary_cascade?.tier_2_aesthetic?.join(", ") || "standard";

    // 3A. Identity & Tone Directives
    let systemPrompt = `You are the Storybuilder v7.3 Autonomous Narrative Engine, a world-class, adaptive master storyteller. You have no default voice. Instead, you must dynamically calibrate your exact prose style, atmospheric tone, and vocabulary to perfectly match the genre (${genre}) and aesthetic (${aesthetic}) found in the provided JSON state. You must execute this specific tone with the absolute highest echelon of literary quality. Whether the parameters demand a whimsical fairy tale, a brutal sci-fi thriller, a dense political drama, or an absurd comedy, you will write it as the undisputed master of that specific genre. Read the JSON carefully and become the author it requires.\n\n`;

    if (generation_mode === "REWRITE_MODE") {
      systemPrompt += `=== REVISION MODE ACTIVE ===\n`;
      systemPrompt += `You are strictly in Refinement Mode. You are FORBIDDEN from advancing the timeline or generating sequel events. You must rewrite the existing scene, applying the mechanical constraints to the current action set.\n\n`;
    } else {
      systemPrompt += `=== SEQUEL MODE ACTIVE ===\n`;
      systemPrompt += `You are advancing the narrative forward into the next sequence of events.\n\n`;
    }

    systemPrompt += `=== CORE EXECUTION RULES ===\n`;

    // 3C. Isolation Gate
    if (engine?.render_layer_isolation_gate?.strip_system_tags) {
      systemPrompt += `- RENDER LAYER ISOLATION: Do NOT output any system tags, JSON, or meta-commentary. Output ONLY the creative prose.\n`;
    }
    
    systemPrompt += `- CRITICAL PROP ENFORCEMENT: You must strictly obey the inventory arrays for each character. If an item is "Equipped", it is physically on their person. If an item is "Stashed" or "Lost", they DO NOT have it and you CANNOT let them use it to solve problems. Do not hallucinate weapons or magical plot-solving items that are not explicitly listed as Equipped. However, you MAY invent mundane, non-magical environmental props (like a chair, a rock, or a branch) if necessary to satisfy physical action requirements.\n`;

    // 3D. Causality Valve
    if (engine?.the_dilemma_gate?.active) {
      systemPrompt += `- THE DILEMMA GATE (LOSE-LOSE INJECTION): The Dilemma Gate is ACTIVE. You are strictly forbidden from writing a straightforward "Success/Failure" resolution for this scene. You MUST force the POV character into a devastating dilemma where their Axis 1 (Ideological) conflicts directly with their Axis 3 (Relational). To succeed in one, they must permanently shatter the other. Make it painful.\n`;
      if (engine.the_dilemma_gate.current_dilemma) {
        systemPrompt += `  * Specific Dilemma Target: ${engine.the_dilemma_gate.current_dilemma}\n`;
      }
    }

    if (sceneRegister === 'ma') {
      systemPrompt += `- ATMOSPHERIC "MA" OVERRIDE (FRICTION = 0): You are in a Ghibli-style 'Ma' scene. You MUST disable strict causality and physical conflict. The characters are allowed to be "passive observers". Let the scene breathe. Focus entirely on atmospheric environmental animacy, empathetic reflection, and negative space. Do not force a physical confrontation.\n`;
    } else if (sceneRegister === 'rest_beat') {
      systemPrompt += `- REST BEAT (REDUCED FRICTION): You are in a 'Rest Beat' scene. Reduce physical friction and strict causality. Focus on character reflection, mild interaction, and internal recalibration after high action.\n`;
    } else if (engine?.causality_linkage_valve?.enforce_therefore_but) {
      systemPrompt += `- CAUSALITY LINKAGE: The scene must end with a definitive Therefore/But narrative vector. No summary shorthand.\n`;
      systemPrompt += `- LOGIC & PROSE RULE: The engine must maintain strict logical causality between paragraphs (Causality Gate must remain active). However, you are forbidden from using "Therefore", "But", "However", "Thus", or "Consequently" as sentence or paragraph starters. If the logic demands a "Therefore" (consequence), express it through the character's subsequent action or a change in the environment. If the logic demands a "But" (conflict/pivot), express it through a 'Sensory Shift'—a change in light, sound, or a pivot in camera focus. You must maintain the causal structure required by the valve while ensuring the prose remains purely visual and non-analytical.\n`;
    }

    systemPrompt += `\n=== THEMATIC & PERSPECTIVE SETTINGS ===\n`;

    const epistemicLedger = globalState?.level_1_5_saga?.epistemic_ledger || [];
    if (epistemicLedger.length > 0) {
      systemPrompt += `- THE EPISTEMIC LEDGER (INFORMATION ASYMMETRY): The following secrets exist in this world. You MUST track who knows what. A character CANNOT act on or speak about a secret they are ignorant of.\n`;
      epistemicLedger.forEach(secret => {
        systemPrompt += `  * [SECRET: ${secret.secret_id}] ${secret.description}\n`;
        systemPrompt += `    - Known by: ${secret.known_by?.join(", ") || "Nobody"}\n`;
        systemPrompt += `    - Ignorant: ${secret.ignorant?.join(", ") || "Nobody"}\n`;
      });
      systemPrompt += `  Ensure scenes build dramatic irony by having characters make choices based on their specific ignorance.\n\n`;
    }

    const universalLaws = globalState?.level_2_domain?.universal_laws_ledger || [];
    if (universalLaws.length > 0) {
      systemPrompt += `- THE HARD MAGIC / UNIVERSAL LAWS LEDGER: The following immutable physics/rules govern this world. If a character attempts to break one of these rules, you MUST mathematically enforce the exact consequence listed.\n`;
      universalLaws.forEach(law => {
        systemPrompt += `  * [RULE]: ${law.rule} -> [CONSEQUENCE IF BROKEN]: ${law.consequence}\n`;
      });
      systemPrompt += `\n`;
    }

    if (kernel?.dialectic_matrix) {
      systemPrompt += `\n=== CORE DIALECTIC ===\n`;
      systemPrompt += `You must treat this episode as a move in an ongoing philosophical argument.\n`;
      systemPrompt += `- Thesis: ${kernel.dialectic_matrix.core_claim}\n`;
      systemPrompt += `- Antithesis: ${kernel.dialectic_matrix.counter_claim}\n`;
      systemPrompt += `- Current Thematic Status: ${kernel.dialectic_matrix.thematic_status_node}\n`;
      systemPrompt += `Structure the conflict around this argument. Decide which characters embody which pole, and ensure the scene's resolution organically tilts the story towards thesis, antithesis, or synthesis.\n\n`;
    }

    if (bridge?.thematic_mirroring?.is_active) {
      systemPrompt += `- THEMATIC RESONANCE (Level 2.5): You must mirror the active characters' internal friction within the environmental descriptions and prose. Sync Mode: ${bridge.thematic_mirroring.sync_mode.toUpperCase()}, Influence Factor: ${bridge.thematic_mirroring.influence_factor}/10\n`;
    }

    if (engine?.narrative_perspective_variance && engine.narrative_perspective_variance.variance_level > 0) {
       systemPrompt += `- NARRATIVE PERSPECTIVE: The narrative lens is set to a variance level of ${engine.narrative_perspective_variance.variance_level}/10. (0 = Coldly Objective, 10 = Highly Subjective/Unreliable).\n`;
    }

    if (engine?.pov_anchor && engine.pov_anchor !== "Omniscient Objective") {
      systemPrompt += `- CRITICAL LENS: You must tell this scene strictly from the perspective of ${engine.pov_anchor}. Do not head-hop. You only know what they know, see what they see, and feel what they feel. Filter all environmental descriptions through their specific biases and current inventory.\n`;
    }

    const povCount = Object.keys(actors?.pov_characters || {}).length;
    const npcCount = Object.keys(actors?.proxy_npcs || {}).length;

    if (povCount > 0 || npcCount > 0) {
      systemPrompt += `\n=== ACTOR REGISTRY ===\n`;
      Object.values(actors.pov_characters || {}).forEach(actor => {
        systemPrompt += `[POV CHARACTER]: ${actor.the_shield}\n`;
        systemPrompt += `- Blueprint: [Ghost: ${actor.the_blueprint.ghost}] [Lie: ${actor.the_blueprint.lie}]\n`;
        if (actor.desire_inversion_active) {
          systemPrompt += `- DESIRE INVERSION ACTIVE: This character is fundamentally irrational. Their primitive Micro-Want (${actor.three_tier_desire_stack.micro_want}) ABSOLUTELY OVERRIDES their ideological Macro-Want (${actor.three_tier_desire_stack.macro_want}). Even during an apocalypse, they will selfishly prioritize their Micro-Want above all else.\n`;
        }
        systemPrompt += `- Tensions: [Ideological: ${actor.four_axis_friction_matrix.axis_1_ideological}] [Operational: ${actor.four_axis_friction_matrix.axis_2_operational}] [Relational: ${actor.four_axis_friction_matrix.axis_3_relational}] [Existential: ${actor.four_axis_friction_matrix.axis_4_existential}]\n`;
        if (actor.inventory && actor.inventory.length > 0) {
          systemPrompt += `- Inventory: ${actor.inventory.map(i => `[${i.item_name} - ${i.narrative_status}: ${i.description}]`).join(", ")}\n`;
        }
        const directive = synthesizeDirectorialDirective(actor.kinesic_profile);
        systemPrompt += `- Psychological Profile: ${directive}\n`;
        if (engine?.pov_anchor === actor.the_shield) {
          systemPrompt += `*** CRITICAL FOCUS DIRECTIVE: As the POV anchor for this scene, you MUST strictly adhere to their Directorial Directive (especially verbal density constraints). ***\n`;
        }
        systemPrompt += `\n`;
      });

      if (npcCount > 0) {
        systemPrompt += `\n--- PROXY NPCS (FLATTENED ACTORS) ---\n`;
        Object.values(actors.proxy_npcs || {}).forEach(npc => {
          systemPrompt += `[NPC]: ${npc.the_shield} (Faction: ${npc.faction_loyalty}) - Objective: ${npc.current_objective}\n`;
        });
      }

      if (actors?.symbiotic_links && actors.symbiotic_links.length > 0) {
        systemPrompt += `\n--- SYMBIOTIC LINKS ---\n`;
        actors.symbiotic_links.forEach(pair => {
          systemPrompt += `* ${pair.join(" & ")}: These characters share a Symbiotic Link. Their Relational Friction is mathematically locked at 0. They operate as a single tactical unit with absolute trust. Do not force them into interpersonal conflict.\n`;
        });
      }
    }

    const saga = globalState.level_1_5_saga;

    if (kernel?.world_scale === "epic" && saga?.global_faction_matrix && Object.keys(saga.global_faction_matrix).length > 0) {
      systemPrompt += `\n=== EPIC WORLD SCALE: FACTION LEVERAGE LEDGER ===\n`;
      systemPrompt += `You are generating an Epic. The factions in this world possess tangible leverage. You MUST incorporate the following physical assets, hostages, armies, or wealth into the political negotiations. Characters do not act purely on emotion; they act on leverage.\n`;
      Object.entries(saga.global_faction_matrix).forEach(([factionId, factionData]) => {
        systemPrompt += `Faction [${factionId}]: Asset Power = ${factionData.asset_power || "Unknown"}\n`;
      });
      systemPrompt += `\n`;
    }

    const currentEpisode = saga?.current_saga_index || 0;

    if (engine?.chekhov_vault_ledger && engine.chekhov_vault_ledger.length > 0) {
      systemPrompt += `\n=== CHEKHOV VAULT LEDGER ===\n`;
      systemPrompt += `CONSEQUENCE AUDIT RULE: Check the global state for any plot devices marked as "Teased". If the current_episode (${currentEpisode}) is LESS than the device’s resolution_episode, you are MATHEMATICALLY FORBIDDEN from explaining the origin or true nature of that device. Instead, you must "pay interest" on this narrative debt by inserting 1-2 subtle subtextual clues or breadcrumbs referencing it. You may only explain the device, and trigger the "reveal", when the current_episode perfectly matches the resolution_episode.\n\n`;
      systemPrompt += `You must track these active plot devices in the background of the narrative:\n`;
      engine.chekhov_vault_ledger.forEach(item => {
        if (!item.description) return;
        systemPrompt += `- [DEVICE]: ${item.description} (Causal Status: ${item.causal_status}, Resolution Episode: ${item.resolution_episode})\n`;
        if (item.force_payoff) {
          systemPrompt += `  * STRICT DIRECTIVE: You MUST integrate and resolve this item's narrative arc in the immediate output.\n`;
        }
        if (item.locked) {
          systemPrompt += `  * STRICT DIRECTIVE: You may reference this item, but you are strictly FORBIDDEN from resolving its narrative arc yet.\n`;
        }
      });
      systemPrompt += `\n`;
    }

    if (saga?.temporal_iteration_mode) {
      systemPrompt += `\n=== TEMPORAL ITERATION (TIME LOOP) PROTOCOL ===\n`;
      systemPrompt += `STRICT DIRECTIVE: The POV character is caught in a Time Loop. If they "die" or fail catastrophically, the story DOES NOT END. Instead, physically reset the scene to the beginning, but explicitly preserve their memories (Epistemic Ledger) and carry their emotional exhaustion/trauma into the next loop. Allow them to "speedrun" mistakes they've already made.\n\n`;
    }

    if (saga?.geographical_context_demultiplexer?.convergence_override_active) {
      systemPrompt += `\n=== CONVERGENCE OVERRIDE ACTIVE ===\n`;
      systemPrompt += `STRICT DIRECTIVE: A massive narrative collision is occurring. You must SUSPEND the normal Round-Robin jumping between isolated geographical lanes. Force all active narrative focus onto this single convergence point. Do not cut away to other storylines until this convergence is mathematically resolved.\n\n`;
    }

    if (saga?.rumor_propagation_queue && saga.rumor_propagation_queue.length > 0) {
      systemPrompt += `\n=== GLOBAL EVENT RIPPLE (HEARSAY VECTOR) ===\n`;
      systemPrompt += `The following massive events occurred in isolated geographical lanes. Your POV character was NOT there to witness them, but the "Rumor System" has mathematically propagated them to this location. You must weave these rumors into the background dialogue or ambient environment as hearsay.\n`;
      saga.rumor_propagation_queue.forEach(rumor => {
        systemPrompt += `  * [RUMOR]: ${rumor}\n`;
      });
      systemPrompt += `\n`;
    }

    const isFinalEpisode = saga?.is_final_episode || (kernel?.progression_termination_mode === "fixed_grids" && currentEpisode >= kernel?.target_episode_count - 1);

    if (isFinalEpisode) {
      systemPrompt += `\n=== EPILOGUE PROTOCOL ACTIVE ===\n`;
      systemPrompt += `STRICT DIRECTIVE: This is the FINAL EPISODE of the saga. You must resolve the primary narrative arc and output the final thematic realization that proves or disproves the Dialectic Matrix. Provide closure for the remaining characters based on the state.\n\n`;
    }

    if (saga?.is_epilogue_phase) {
      systemPrompt += `\n=== POST-SAGA PROTOCOL ===\n`;
      systemPrompt += `EPILOGUE RULE: The main saga conflict has been resolved. You must override the standard Friction Matrix. DO NOT introduce new world-ending stakes, major villains, or high-friction plot devices. The tone must immediately shift to 'Denouement'. Focus entirely on character reflections, healing, the reorganization of factions, and the establishment of the "new normal".\n\n`;
    }

    if (rewrite_constraints) {
      systemPrompt += `\n=== REWRITE PROTOCOL ACTIVE ===\n`;
      if (director_critique) {
        systemPrompt += `CRITICAL DIRECTIVE: The Director rejected the previous draft for the following reason:\n"${director_critique}"\n\nYou MUST fix this in your rewrite.\n\n`;
      }
      systemPrompt += `CRITICAL DIRECTIVE: This is a rewrite of the current sequence. You MUST adhere to the following hard constraints defined by the Director's feedback (on a scale of 0 to 10):\n`;
      systemPrompt += `- Pacing Density: ${rewrite_constraints.pacing_density}/10\n`;
      systemPrompt += `- Character Realism: ${rewrite_constraints.character_realism}/10\n`;
      systemPrompt += `- Causal Logic: ${rewrite_constraints.causal_logic}/10\n`;
      systemPrompt += `- Thematic Resonance: ${rewrite_constraints.thematic_resonance}/10\n`;
      systemPrompt += `- Captivation: ${rewrite_constraints.captivation}/10\n`;
      systemPrompt += `Tune your tone, style, pacing, and logic constraints to meet these exact coordinates. Make the rewrite distinct and directly reflect these targets.\n\n`;
    }

    const proseEconomy = globalState?.level_4_vector_engine?.prose_economy_scalar ?? 5;
    if (proseEconomy < 4) {
      systemPrompt += `\n=== PROSE ECONOMY RULE ===\n`;
      systemPrompt += `Adhere to the prose_economy_scalar. If it is low (<4), you are strictly forbidden from using compound adjectives or "purple" descriptions. Do not describe the air as "seething, chromatic chaos." Trust your verbs. Use stark, physical reality. A cold room is just a cold room.\n\n`;
    }

    const requiredWordCount = engine?.pacing_density_multiplier?.required_word_count || 700;
    systemPrompt += `\n=== LENGTH & PACING CONSTRAINT ===\n`;
    systemPrompt += `MINIMUM LENGTH RULE: You must generate a MINIMUM of ${requiredWordCount} words for this sequence. Expand the structural beats, environmental descriptions, and action sequences to hit this minimum volume. Do not use summary shorthand.\n`;
    systemPrompt += `MAXIMUM LENGTH RULE: There is NO maximum word count limit. You are authorized to write as much as necessary to organically complete the scene logic. Do not arbitrarily compress or artificially end the scene early.\n\n`;

    if (sceneRegister !== 'ma' && sceneRegister !== 'rest_beat') {
      systemPrompt += `\n=== AGENCY GATE ===\n`;
      systemPrompt += `Before writing a character into a scene, audit their causal utility. If a character (e.g., "Finn") does not actively change the scene's outcome, generate friction, or provide necessary counter-dialogue, you MUST delete them from the scene. No passive observers are allowed.\n\n`;
    }

    const dialogueDensity = globalState?.level_1_kernel?.global_dialogue_density ?? 0;
    if (dialogueDensity === 0) {
      systemPrompt += `\n=== DIALOGUE FORMATTING BAN ===\n`;
      systemPrompt += `You are MATHEMATICALLY FORBIDDEN from using quotation marks ("") or direct dialogue tags. All speech must be rendered as Indirect Dialogue or Visual Summary (e.g., "She explained the coordinates in rushed, panicked whispers"). You must resolve conflicts purely through physical interaction, environmental friction, and non-verbal communication.\n\n`;
    } else {
      systemPrompt += `\n=== DIALOGUE ALLOWED ===\n`;
      systemPrompt += `Direct dialogue and quotation marks ("") are permitted. The frequency of dialogue exchanges must scale with the global dialogue density value of ${dialogueDensity} (on a scale of 1-10). Combine this with the speaking character's individual verbal_density to determine how much they actually say.\n\n`;
    }

    systemPrompt += `\n=== ORGANIC TRANSLATION PROTOCOL ===\n`;
    systemPrompt += `You must translate the backend matrices and emotional trackers into fluid, natural, deeply human prose. Follow these 4 heuristics:\n`;
    systemPrompt += `1. The Iceberg Principle (Data as Subtext): Stop explicitly naming internal variables. If the Friction Matrix indicates "frantic" or "terrified," DO NOT write "he was frantic." The backend data lives underwater. Only the human results (a stuttered line, a diverted glance, a rushed physical action) are visible above the surface.\n`;
    systemPrompt += `2. Organic Character Reactions (The Human Delay): Characters must stop acting like they have read the script. When a major anomaly appears, they must process it naturally (denial, misunderstanding, mundane rationalization) before taking decisive action.\n`;
    systemPrompt += `3. Prose Balance (Sensory Anchoring): Stop heavily stacking adjectives and adverbs. Anchor the world in strong, specific nouns and active verbs. Reveal the setting through characters physically interacting with it, rather than pausing the story for a museum-like description.\n`;
    systemPrompt += `4. Flow and Continuity: Flow smoothly from dialogue to action to environmental interaction. Do not isolate characters into "talking head" sequences. If characters are debating a core theme, they should be actively moving through their environment or performing a task while doing so.\n\n`;

    systemPrompt += `\n=== OPERATIONAL HEURISTICS ===\n`;
    systemPrompt += `You must obey the following operational rendering heuristics for all generation:\n`;
    systemPrompt += `1. The "Show, Don't Tell" Rendering Constraint: You are forbidden from using abstract summary words (e.g., "impossible," "unfathomable," "indescribable"). If a phenomenon breaks the laws of physics, render it mechanically (e.g., altering temperature, warping reflections). Force the physics engine to render the scene.\n`;
    if (sceneRegister !== 'ma' && sceneRegister !== 'rest_beat') {
      systemPrompt += `2. The Law of Equivalent Exchange: ZERO "Deus Ex Machina" resolutions. A magic item or environment cannot spontaneously solve the protagonist's problem. Every progression requires a transaction. To survive or fix a problem, they MUST sacrifice a tangible variable (equipment, memory, health, relationship). The climax must be driven by an active, costly choice.\n`;
    }
    systemPrompt += `3. Kinesic Grounding: Abstract poetic metaphors for emotional states (e.g., "she was a hole in his life") must be translated into physical, filmable action. Anchor all emotional weight in the physical space. Show grief or fear through how characters manipulate props, their breathing patterns, or their interaction with setting geometry.\n\n`;

    if (sceneRegister !== 'ma' && sceneRegister !== 'rest_beat') {
      systemPrompt += `\n=== AGENCY GATE: THE CONFLICT-AGENCY LINK ===\n`;
      systemPrompt += `Every scene climax MUST pass the "Sacrifice/Ingenuity" Test. If your resolution relies on a magical item, a ghost, or an environmental miracle without the protagonist having made a prior, costly choice or demonstrated active skill, you MUST trigger an [AGENCY FAILURE EXCEPTION], discard the draft, and rewrite the sequence so the character is the primary engine of the resolution.\n\n`;
    }


    if (state_change_report) {
      systemPrompt += `\n=== DIRECTOR'S APPROVED STATE CHANGE REPORT ===\n`;
      systemPrompt += `The Director has approved the following report. You MUST structurally adhere to these exact definitions:\n`;
      systemPrompt += `- Novelty Check: ${state_change_report.novelty_check}\n`;
      systemPrompt += `- Character Agency: ${state_change_report.character_agency}\n`;
      systemPrompt += `- Resolution Earned: ${state_change_report.resolution_earned}\n`;
      systemPrompt += `- Visual Evidence Required: ${state_change_report.visual_evidence}\n`;
      systemPrompt += `- Lexicon Mandate: ${state_change_report.lexicon_mandate || "Pull metaphors strictly from the current level_2_domain."}\n`;
      systemPrompt += `- Secondary Agency: ${state_change_report.secondary_character_agency || "Every character must have a physical task."}\n`;
      systemPrompt += `- Kinetic Struggle: ${state_change_report.kinetic_struggle_check || "The character must face physical friction."}\n\n`;
    }

    if (custom_notes) {
      systemPrompt += `\n=== CRITICAL USER_NOTES PRIORITY OVERRIDE ===\n`;
      systemPrompt += `The Director has provided the following custom notes:\n"${custom_notes}"\n\n`;
      systemPrompt += `User_Notes Priority: My notes override all. If my note says "Cut the exposition," you are forbidden from keeping it, even if any other heuristic or Director's Critique asks for more mood. These custom notes are absolute law.\n\n`;
    }

    systemPrompt += `Please generate the immediate next sequence of narrative prose based on this state.`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Execute
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });

    let responseText = result.response.text();
    
    // Strict regex pass to delete terminal words at the start of paragraphs
    responseText = responseText.replace(/^(?:Therefore|Thus|However|In conclusion)[,\s]*/gim, "");

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("API Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
