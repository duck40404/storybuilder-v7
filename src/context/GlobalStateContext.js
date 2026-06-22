"use client";

import React, { createContext, useContext, useState } from "react";

export const DEFAULT_BLANK_STATE = {
  "hybrid_locks": {
    "level_1_sliders": false,
    "level_1_dialectic": false,
    "level_3_actors": false
  },
  "level_1_kernel": {
    "raw_spark_text": "",
    "dialogue_density_slider": 0,
    "user_agency_regulator": "automated | hybrid | manual",
    "progression_termination_mode": "fixed_grids | organic_convergence",
    "target_episode_count": 1,
    "entropy_slider": 5,
    "scope_valve": "micro_stakes | macro_stakes",
    "protagonist_distribution_mode": "single_focus | ensemble_round_robin",
    "dialectic_matrix": {
      "core_claim": "string",
      "counter_claim": "string",
      "thematic_status_node": "equilibrium | confrontation | synthesis"
    },
    "structural_rhythm_preset": "slow_burn | relentless_compression",
    "ending_payload_controller": "open | closed_finality | closed_loop"
  },
  "level_1_5_saga": {
    "inter_scene_buffer_latch": true,
    "temporal_bleed_vector": "active",
    "saga_progression_rail": [],
    "geographical_context_demultiplexer": {
      "active_context_lanes": {}
    },
    "current_saga_index": 0,
    "is_final_episode": false,
    "episode_history": [],
    "global_faction_matrix": {},
    "continuity_lock_ledger": {},
    "terminal_resolution_triggers": {
      "gate_a_dialectic_synthesis": false,
      "gate_b_friction_equilibrium": false,
      "gate_c_vault_clearance": false
    },
    "cumulative_synopsis": "",
    "immediate_synopsis": ""
  },
  "level_2_domain": {
    "hegemony_node": {
      "mass_slider": 5.0
    },
    "environmental_animacy_scalar": 5.0,
    "objectivity_regulator_switch": "subjective_mirror | absolute_objective",
    "dictionary_cascade": {
      "tier_1_genre": [],
      "tier_2_aesthetic": [],
      "tier_3_density_scalar": 5.0
    },
    "location_ledger": [], // Relational storage for locations
    "environmental_props": [],
    "plot_devices": [],
    "active_viewport_box": {
      "current_location_id": "string",
      "local_container_volume": "string",
      "local_prop_registry": []
    },
    "text_modification_ledger": []
  },
  "level_2_5_thematic_bridge": {
    "thematic_mirroring": {
      "is_active": false,
      "influence_factor": 0.0,
      "sync_mode": "passive"
    }
  },
  "level_3_actor_cards": {
    "directory_ledger": {}, // Relational storage for characters
    "active_viewport_slots": [null, null, null, null]
  },
  "level_4_vector_engine": {
    "pacing_density_multiplier": {
      "target_scene_minutes": 5.0,
      "expansion_scalar": 140,
      "required_word_count": 700,
      "beat_density_minimum": 5
    },
    "render_layer_isolation_gate": {
      "active": true,
      "strip_system_tags": true,
      "on_exception": "crash_and_rewrite"
    },
    "mutation_incubation_valve": {
      "mode": "shatter_interrupt | accumulator_buffer",
      "shatter_threshold": 7.5,
      "state_latch_bypass_registry": []
    },
    "causality_linkage_valve": {
      "enforce_therefore_but": true,
      "prohibit_and_then": true
    },
    "pov_anchor": "Omniscient Objective",
    "kinesic_token_injector": {
      "enabled": true,
      "somatic_trigger_threshold": 7.5
    },
    "narrative_perspective_variance": {
      "variance_level": 0,
      "perception_filter": "default"
    },
    "current_scene_context": {
      "scene_beat_counter": 0,
      "generated_word_count": 0,
      "scarcity_index": 5.0,
      "equilibrium_comparator_delta": 0.0
    },
    "chekhov_vault_ledger": [
      {
        "id": "mock_vault_item_01",
        "description": "A rusted pocket watch belonging to the antagonist",
        "force_payoff": false,
        "locked": false
      }
    ]
  },
  "level_5_narrative_echo_matrix": {
    "synthesis_validator": {
      "internal_need_met": false,
      "external_want_achieved": false,
      "structural_resolution_frame": "synthesis | tragedy | irony | hollow_victory"
    },
    "epilogue_sub_modules": {
      "thematic_stamp_valve": "pending_final_compile",
      "geopolitical_scar_ledger": [],
      "cast_web_dispersion_table": []
    }
  }
};

const GlobalStateContext = createContext();

export function GlobalStateProvider({ children }) {
  const [state, setState] = useState({
    root_seed: JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)),
    current_state: JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE))
  });

  // Helper method to make partial state updates to the current_state easier
  const updateState = (updates) => {
    setState((prevState) => ({
      ...prevState,
      current_state: {
        ...prevState.current_state,
        ...updates,
      }
    }));
  };

  // Atomic state swap
  const applyNewState = (fullyConstructedState) => {
    setState((prevState) => ({
      ...prevState,
      current_state: fullyConstructedState
    }));
  };

  // Modular Accessors for Relational Data
  const getCharacterById = (id) => {
    return state.current_state.level_3_actor_cards.directory_ledger[id] || null;
  };

  const getLocationById = (id) => {
    return state.current_state.level_2_domain.location_ledger[id] || null;
  };

  // Snapshot Functions
  const exportSnapshot = () => {
    return JSON.stringify(state, null, 2);
  };

  const loadSnapshot = (snapshotJSON) => {
    try {
      const parsed = JSON.parse(snapshotJSON);
      setState(parsed);
    } catch (e) {
      console.error("Failed to load snapshot", e);
    }
  };

  return (
    <GlobalStateContext.Provider 
      value={{ 
        state, 
        setState, 
        updateState,
        applyNewState,
        getCharacterById,
        getLocationById,
        exportSnapshot,
        loadSnapshot
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
}
