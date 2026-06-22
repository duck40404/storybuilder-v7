import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const globalState = body.state;
    
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

    const genre = domain?.dictionary_cascade?.tier_1_genre?.join(", ") || "generic";
    const aesthetic = domain?.dictionary_cascade?.tier_2_aesthetic?.join(", ") || "standard";

    // 3A. Identity & Tone Directives
    let systemPrompt = `You are the Storybuilder v7.3 Autonomous Narrative Engine, a world-class, adaptive master storyteller. You have no default voice. Instead, you must dynamically calibrate your exact prose style, atmospheric tone, and vocabulary to perfectly match the genre (${genre}) and aesthetic (${aesthetic}) found in the provided JSON state. You must execute this specific tone with the absolute highest echelon of literary quality. Whether the parameters demand a whimsical fairy tale, a brutal sci-fi thriller, a dense political drama, or an absurd comedy, you will write it as the undisputed master of that specific genre. Read the JSON carefully and become the author it requires.\n\n`;

    systemPrompt += `=== CORE EXECUTION RULES ===\n`;

    // 3C. Isolation Gate
    if (engine?.render_layer_isolation_gate?.strip_system_tags) {
      systemPrompt += `- RENDER LAYER ISOLATION: Do NOT output any system tags, JSON, or meta-commentary. Output ONLY the creative prose.\n`;
    }
    
    systemPrompt += `- CRITICAL PROP ENFORCEMENT: You must strictly obey the inventory arrays for each character. If an item is "Equipped", it is physically on their person. If an item is "Stashed" or "Lost", they DO NOT have it and you CANNOT let them use it to solve problems. Do not hallucinate weapons or props that are not explicitly listed as Equipped.\n`;

    // 3D. Causality Valve
    if (engine?.causality_linkage_valve?.enforce_therefore_but) {
      systemPrompt += `- CAUSALITY LINKAGE: The scene must end with a definitive Therefore/But narrative vector. No summary shorthand.\n`;
    }

    systemPrompt += `\n=== THEMATIC & PERSPECTIVE SETTINGS ===\n`;

    if (kernel?.dialogue_density_slider !== undefined) {
      systemPrompt += `- DIALOGUE DENSITY: The user has set the Dialogue Density to ${kernel.dialogue_density_slider} out of 10. If this is 0, write purely visual, atmospheric prose with zero spoken dialogue. If it is 10, rely heavily on conversation.\n`;
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

    const actorCount = Object.keys(actors?.directory_ledger || {}).length;
    if (actorCount > 0) {
      systemPrompt += `\n=== ACTOR REGISTRY ===\n`;
      Object.values(actors.directory_ledger).forEach(actor => {
        systemPrompt += `Actor: ${actor.the_shield}\n`;
        systemPrompt += `- Blueprint: [Ghost: ${actor.the_blueprint.ghost}] [Lie: ${actor.the_blueprint.lie}]\n`;
        systemPrompt += `- Tensions: [Ideological: ${actor.four_axis_friction_matrix.axis_1_ideological}] [Operational: ${actor.four_axis_friction_matrix.axis_2_operational}] [Relational: ${actor.four_axis_friction_matrix.axis_3_relational}] [Existential: ${actor.four_axis_friction_matrix.axis_4_existential}]\n`;
        if (actor.inventory && actor.inventory.length > 0) {
          systemPrompt += `- Inventory: ${actor.inventory.map(i => `[${i.item_name} - ${i.narrative_status}: ${i.description}]`).join(", ")}\n`;
        }
        systemPrompt += `\n`;
      });
    }

    if (engine?.chekhov_vault_ledger && engine.chekhov_vault_ledger.length > 0) {
      systemPrompt += `\n=== CHEKHOV VAULT LEDGER ===\n`;
      systemPrompt += `You must track these active plot devices in the background of the narrative:\n`;
      engine.chekhov_vault_ledger.forEach(item => {
        if (!item.description) return;
        systemPrompt += `- [DEVICE]: ${item.description}\n`;
        if (item.force_payoff) {
          systemPrompt += `  * STRICT DIRECTIVE: You MUST integrate and resolve this item's narrative arc in the immediate output.\n`;
        }
        if (item.locked) {
          systemPrompt += `  * STRICT DIRECTIVE: You may reference this item, but you are strictly FORBIDDEN from resolving its narrative arc yet.\n`;
        }
      });
      systemPrompt += `\n`;
    }

    const saga = globalState.level_1_5_saga;
    const isFinalEpisode = saga?.is_final_episode || (kernel?.progression_termination_mode === "fixed_grids" && saga?.current_saga_index >= kernel?.target_episode_count - 1);

    if (isFinalEpisode) {
      systemPrompt += `\n=== EPILOGUE PROTOCOL ACTIVE ===\n`;
      systemPrompt += `STRICT DIRECTIVE: This is the FINAL EPISODE of the saga. You must resolve the primary narrative arc and output the final thematic realization that proves or disproves the Dialectic Matrix. Provide closure for the remaining characters based on the state.\n\n`;
    }

    // 3B. Pass Entire State
    systemPrompt += `\n=== FULL GLOBAL STATE JSON ===\n${JSON.stringify(globalState, null, 2)}\n==============================\n\n`;
    systemPrompt += `Please generate the immediate next sequence of narrative prose based on this state.`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Execute
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });

    const responseText = result.response.text();
    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("API Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
