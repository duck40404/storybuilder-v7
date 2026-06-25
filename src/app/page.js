"use client";

import { useState } from "react";
import { useGlobalState, DEFAULT_BLANK_STATE } from "@/context/GlobalStateContext";
import TagInput from "@/components/TagInput";
import { compileEpisode } from "@/services/storyCompiler";
import { synthesizeDirectorialDirective } from "@/services/kinesicSynthesis";

export default function ControlRoom() {
  const { state, updateState, applyNewState, exportSnapshot } = useGlobalState();
  
  const [rawPremise, setRawPremise] = useState("");
  const [autobuildWorldScale, setAutobuildWorldScale] = useState("AI Default");
  const [autobuildComplexity, setAutobuildComplexity] = useState("AI Default");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isUpdatingSynopsis, setIsUpdatingSynopsis] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [sparkFingerprint, setSparkFingerprint] = useState(null);
  const [directorsNotes, setDirectorsNotes] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [customNotes, setCustomNotes] = useState("");
  const [useDirectorCritique, setUseDirectorCritique] = useState(true);
  const [compilationMode, setCompilationMode] = useState("SEQUEL_MODE");
  const [isPreparing, setIsPreparing] = useState(false);
  const [stateChangeReport, setStateChangeReport] = useState(null);
  const [draggedAxis, setDraggedAxis] = useState(null);
  const [draggedCharAxis, setDraggedCharAxis] = useState(null);
  const [rewriteSliders, setRewriteSliders] = useState({
    pacing_density: 5,
    character_realism: 5,
    causal_logic: 5,
    thematic_resonance: 5,
    captivation: 5
  });

  // Saga Trajectory State
  const [trajectoryMode, setTrajectoryMode] = useState("ORGANIC_CONVERGENCE");
  const [targetEpisodes, setTargetEpisodes] = useState(50);
  const [minEpisodes, setMinEpisodes] = useState(10);
  const [maxEpisodes, setMaxEpisodes] = useState(20);
  const [preFlightEntropy, setPreFlightEntropy] = useState(5);
  const [engineCapacity, setEngineCapacity] = useState(50);

  const handleCapacityChange = (val) => {
    setEngineCapacity(val);
    if (val === 0) {
      updateKernel({ user_agency_regulator: 'automated' });
      updateHybridLocks({ level_1_sliders: false, level_1_dialectic: false, level_3_actors: false });
    } else if (val === 50) {
      updateKernel({ user_agency_regulator: 'hybrid' });
    } else if (val === 100) {
      updateKernel({ user_agency_regulator: 'manual' });
    }
  };
  
  // Archival System State
  const [isSaving, setIsSaving] = useState(false);
  const [availableSagas, setAvailableSagas] = useState([]);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  // Structured Brief Ingestion State
  const [structuredBrief, setStructuredBrief] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  const handleIngestBrief = async () => {
    if (!structuredBrief.trim()) return;
    setIsIngesting(true);
    try {
      const res = await fetch("/api/ingest-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief_text: structuredBrief,
          global_state: state.current_state
        })
      });
      const data = await res.json();
      if (data.success) {
        applyNewState(data.merged_state);
        setStructuredBrief("");
      } else {
        alert("Failed to ingest brief: " + data.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
    setIsIngesting(false);
  };

  const transformActorArraysToObjects = (actorCards) => {
    if (!actorCards) return actorCards;
    const transform = (input) => {
      if (!Array.isArray(input)) return input;
      const obj = {};
      input.forEach(actor => {
        if (actor.character_id) {
          obj[actor.character_id] = actor;
        }
      });
      return obj;
    };
    return {
      ...actorCards,
      pov_characters: transform(actorCards.pov_characters),
      proxy_npcs: transform(actorCards.proxy_npcs)
    };
  };

  if (!state || !state.current_state) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400 animate-pulse">Initializing Engine...</div>;
  }

  const kernel = state.current_state.level_1_kernel;
  const domain = state.current_state.level_2_domain;
  const bridge = state.current_state.level_2_5_thematic_bridge;
  const actors = state.current_state.level_3_actor_cards;
  const engine = state.current_state.level_4_vector_engine;
  const saga = state.current_state.level_1_5_saga;
  const matrix = state.current_state.level_5_narrative_echo_matrix;
  const hybridLocks = state.current_state.hybrid_locks;

  // --- Level 1 Updaters ---
  const updateKernel = (updates) => {
    updateState({
      level_1_kernel: { ...kernel, ...updates },
    });
  };

  const updateDialectic = (key, value) => {
    updateKernel({
      dialectic_matrix: { ...kernel.dialectic_matrix, [key]: value },
    });
  };

  // --- Level 2 Updaters ---
  const updateDomain = (updates) => {
    updateState({
      level_2_domain: { ...domain, ...updates },
    });
  };

  const updateDictionary = (key, value) => {
    updateDomain({
      dictionary_cascade: { ...domain.dictionary_cascade, [key]: value },
    });
  };

  const updateViewport = (key, value) => {
    updateDomain({
      active_viewport_box: { ...domain.active_viewport_box, [key]: value },
    });
  };

  // --- Level 3 Updaters ---
  const updateActors = (updates) => {
    updateState({
      level_3_actor_cards: { ...actors, ...updates },
    });
  };

  const addCharacter = () => {
    const id = crypto.randomUUID();
    const newCharacter = {
      the_shield: "",
      the_blueprint: { ghost: "", lie: "" },
      internal_need_target: "",
      four_axis_friction_matrix: {
        axis_1_ideological: 5.0,
        axis_2_operational: 5.0,
        axis_3_relational: 5.0,
        axis_4_existential: 5.0
      },
      kinesic_profile: {
        morality_empathy: 5,
        action_bias: 5,
        emotional_armor: 5,
        thematic_alignment: 5,
        verbal_density: 5
      },
      three_tier_desire_stack: {
        macro_want: "",
        meso_want: "",
        micro_want: ""
      },
      utility_variable: {},
      design_node: {},
      inventory: []
    };

    updateActors({
      pov_characters: {
        ...actors.pov_characters,
        [id]: newCharacter
      }
    });
  };

  const deleteCharacter = (id) => {
    const newPov = { ...actors.pov_characters };
    const newNpc = { ...actors.proxy_npcs };
    delete newPov[id];
    delete newNpc[id];
    updateActors({ pov_characters: newPov, proxy_npcs: newNpc });
  };

  const updateCharacter = (id, updates) => {
    if (actors.pov_characters && actors.pov_characters[id]) {
      updateActors({
        pov_characters: {
          ...actors.pov_characters,
          [id]: {
            ...actors.pov_characters[id],
            ...updates
          }
        }
      });
    } else if (actors.proxy_npcs && actors.proxy_npcs[id]) {
      updateActors({
        proxy_npcs: {
          ...actors.proxy_npcs,
          [id]: {
            ...actors.proxy_npcs[id],
            ...updates
          }
        }
      });
    }
  };

  // --- Level 2.5 Updaters ---
  const updateBridge = (updates) => {
    updateState({
      level_2_5_thematic_bridge: {
        ...bridge,
        thematic_mirroring: { ...bridge.thematic_mirroring, ...updates },
      },
    });
  };

  // --- Level 4 Updaters ---
  const updateEngine = (updates) => {
    updateState({
      level_4_vector_engine: { ...engine, ...updates },
    });
  };

  const updateNarrator = (updates) => {
    updateEngine({
      narrative_perspective_variance: { ...engine.narrative_perspective_variance, ...updates },
    });
  };

  const addVaultItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      description: "",
      force_payoff: false,
      locked: false
    };
    updateEngine({
      chekhov_vault_ledger: [...engine.chekhov_vault_ledger, newItem]
    });
  };

  const updateVaultItem = (id, updates) => {
    updateEngine({
      chekhov_vault_ledger: engine.chekhov_vault_ledger.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    });
  };

  const deleteVaultItem = (id) => {
    updateEngine({
      chekhov_vault_ledger: engine.chekhov_vault_ledger.filter(item => item.id !== id)
    });
  };

  // --- Hybrid Lock Updaters ---
  const updateHybridLocks = (updates) => {
    updateState({
      hybrid_locks: { ...hybridLocks, ...updates },
    });
  };

  // --- Level 1.5 Updaters ---
  const updateSaga = (updates) => {
    updateState({
      level_1_5_saga: { ...saga, ...updates },
    });
  };

  // --- Level 5 Updaters ---
  const updateMatrix = (updates) => {
    updateState({
      level_5_narrative_echo_matrix: { ...matrix, ...updates },
    });
  };

  const updateSynthesis = (updates) => {
    updateMatrix({
      synthesis_validator: { ...matrix.synthesis_validator, ...updates }
    });
  };

  const updateEpilogue = (updates) => {
    updateMatrix({
      epilogue_sub_modules: { ...matrix.epilogue_sub_modules, ...updates }
    });
  };

  const handleRefinePremise = async () => {
    if (!rawPremise.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const response = await fetch('/api/refine-spark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_spark_text: rawPremise })
      });

      if (!response.ok) {
        throw new Error('Failed to refine premise');
      }

      const data = await response.json();
      if (data.refinedPremise) {
        setRawPremise(data.refinedPremise);
        if (data.recommendedEntropyIndex !== undefined) {
          updateKernel({ narrative_entropy_index: data.recommendedEntropyIndex });
        }
        if (data.fingerprint) {
          setSparkFingerprint(data.fingerprint);
        }
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Refine Premise Error:", error);
      alert("Failed to refine: " + error.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleAutoConfigure = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/autobuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          raw_spark_text: rawPremise,
          trajectory: {
            mode: trajectoryMode,
            target: targetEpisodes,
            min: minEpisodes,
            max: maxEpisodes
          },
          entropy_index: preFlightEntropy,
          world_scale: autobuildWorldScale,
          complexity: autobuildComplexity,
          fingerprint: sparkFingerprint
        })
      });

      if (!response.ok) {
        throw new Error('Failed to auto-build framework');
      }

      const generatedSettings = await response.json();
      let nextState = { ...state.current_state };

      if (generatedSettings.generated_spark) {
        setRawPremise(generatedSettings.generated_spark);
        nextState.level_1_kernel = {
          ...nextState.level_1_kernel,
          raw_spark_text: generatedSettings.generated_spark,
          user_agency_regulator: "automated"
        };
      }

      // Merge Level 1 Kernel
      if (generatedSettings.level_1_kernel) {
        const { dialectic_matrix, user_agency_regulator, ...restKernel } = generatedSettings.level_1_kernel;
        if (!hybridLocks.level_1_sliders) {
          nextState.level_1_kernel = {
            ...nextState.level_1_kernel,
            ...restKernel,
            ...(generatedSettings.generated_spark ? {} : { user_agency_regulator })
          };
        }
        if (!hybridLocks.level_1_dialectic && dialectic_matrix) {
          nextState.level_1_kernel = {
            ...nextState.level_1_kernel,
            dialectic_matrix
          };
        }
      }

      // Merge Level 2 Domain
      if (generatedSettings.level_2_domain) {
        nextState.level_2_domain = {
          ...nextState.level_2_domain,
          dictionary_cascade: generatedSettings.level_2_domain.dictionary_cascade ? {
            ...nextState.level_2_domain.dictionary_cascade,
            ...generatedSettings.level_2_domain.dictionary_cascade
          } : nextState.level_2_domain.dictionary_cascade,
          hegemony_node: typeof generatedSettings.level_2_domain.hegemony_node === 'object' 
            ? { ...nextState.level_2_domain.hegemony_node, ...generatedSettings.level_2_domain.hegemony_node }
            : nextState.level_2_domain.hegemony_node,
          active_viewport_box: typeof generatedSettings.level_2_domain.active_viewport_box === 'object'
            ? { ...nextState.level_2_domain.active_viewport_box, ...generatedSettings.level_2_domain.active_viewport_box }
            : nextState.level_2_domain.active_viewport_box,
          location_ledger: generatedSettings.level_2_domain.location_ledger || nextState.level_2_domain.location_ledger,
          environmental_props: generatedSettings.level_2_domain.environmental_props || nextState.level_2_domain.environmental_props,
          worldbuilding_reasoning: generatedSettings.level_2_domain.worldbuilding_reasoning || nextState.level_2_domain.worldbuilding_reasoning
        };

        if (generatedSettings.level_2_domain.chekhov_vault_ledger) {
          nextState.level_4_vector_engine = {
            ...nextState.level_4_vector_engine,
            chekhov_vault_ledger: generatedSettings.level_2_domain.chekhov_vault_ledger
          };
        }
      }

      // Merge Level 3 Actor Cards
      if (generatedSettings.level_3_actor_cards && !hybridLocks.level_3_actors) {
        const transformedCards = transformActorArraysToObjects(generatedSettings.level_3_actor_cards);
        nextState.level_3_actor_cards = {
          ...nextState.level_3_actor_cards,
          symbiotic_links: transformedCards.symbiotic_links || [],
          pov_characters: transformedCards.pov_characters || {},
          proxy_npcs: transformedCards.proxy_npcs || {}
        };
      }

      applyNewState(nextState);

    } catch (error) {
      console.error("Auto-Build Error:", error);
      alert("Failed to auto-build: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const keys = ["pacing_density", "character_realism", "causal_logic", "thematic_resonance", "captivation"];
  const labels = ["Pacing", "Realism", "Logic", "Resonance", "Captivation"];

  const getRadarPoint = (index, value, center = 150, maxRadius = 90) => {
    const angleRad = ((-90 + index * 72) * Math.PI) / 180;
    const r = (value / 10) * maxRadius;
    const x = center + r * Math.cos(angleRad);
    const y = center + r * Math.sin(angleRad);
    return { x, y };
  };

  const handlePointerDown = (index) => (e) => {
    e.target.setPointerCapture(e.pointerId);
    setDraggedAxis(index);
  };

  const handlePointerMove = (e) => {
    if (draggedAxis === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgSize = 300;
    const scaleX = svgSize / rect.width;
    const scaleY = svgSize / rect.height;
    
    const x = clientX * scaleX - 150;
    const y = clientY * scaleY - 150;
    
    const targetAngleRad = ((-90 + draggedAxis * 72) * Math.PI) / 180;
    const axisX = Math.cos(targetAngleRad);
    const axisY = Math.sin(targetAngleRad);
    const projection = x * axisX + y * axisY;
    
    const maxRadius = 90;
    let score = (projection / maxRadius) * 10;
    score = Math.max(0, Math.min(10, score));
    score = Math.round(score * 10) / 10;
    
    setRewriteSliders(prev => ({
      ...prev,
      [keys[draggedAxis]]: score
    }));
  };

  const handlePointerUp = (e) => {
    if (draggedAxis !== null) {
      e.target.releasePointerCapture(e.pointerId);
      setDraggedAxis(null);
    }
  };

  const charKeys = ["action_bias", "morality_empathy", "emotional_armor", "thematic_alignment", "verbal_density"];
  const charLabels = ["Action", "Empathy", "Armor", "Theme", "Verbal"];

  const handleCharPointerDown = (id, index) => (e) => {
    e.target.setPointerCapture(e.pointerId);
    setDraggedCharAxis({ id, axis: index });
  };

  const handleCharPointerMove = (e) => {
    if (!draggedCharAxis) return;
    const { id, axis } = draggedCharAxis;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgSize = 300;
    const scaleX = svgSize / rect.width;
    const scaleY = svgSize / rect.height;
    
    const x = clientX * scaleX - 150;
    const y = clientY * scaleY - 150;
    
    const targetAngleRad = ((-90 + axis * 72) * Math.PI) / 180;
    const axisX = Math.cos(targetAngleRad);
    const axisY = Math.sin(targetAngleRad);
    const projection = x * axisX + y * axisY;
    
    const maxRadius = 90;
    let score = (projection / maxRadius) * 10;
    score = Math.max(0, Math.min(10, score));
    score = Math.round(score);
    
    const char = actors.pov_characters?.[id] || actors.proxy_npcs?.[id];
    if (char) {
      const currentProfile = char.kinesic_profile || { morality_empathy: 5, action_bias: 5, emotional_armor: 5, thematic_alignment: 5, verbal_density: 0 };
      updateCharacter(id, {
        kinesic_profile: { ...currentProfile, [charKeys[axis]]: score }
      });
    }
  };

  const handleCharPointerUp = (e) => {
    if (draggedCharAxis !== null) {
      e.target.releasePointerCapture(e.pointerId);
      setDraggedCharAxis(null);
    }
  };

  const handlePrepareNextSequence = async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    setDirectorsNotes(null);
    setStateChangeReport(null);
    setShowReviewPanel(false);
    setCompilationMode("SEQUEL_MODE");
    setGeneratedText("... Preparing Level 1-4 State (Sequel Mode) ...");
    
    try {
      const snapshotJSON = exportSnapshot();
      const parsedState = JSON.parse(snapshotJSON);
      
      const response = await fetch('/api/prepare-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          global_state: parsedState.current_state,
          mode: 'SEQUEL_MODE',
          custom_notes: customNotes,
          use_director_critique: useDirectorCritique,
          director_critique: directorsNotes,
          previous_episode_text: generatedText,
          cumulative_synopsis: parsedState.current_state.level_1_5_saga.cumulative_synopsis
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      updateState({
        level_1_kernel: data.level_1_kernel, 
        level_1_5_saga: data.level_1_5_saga,
        level_2_domain: data.level_2_domain, 
        level_3_actor_cards: transformActorArraysToObjects(data.level_3_actor_cards),
        level_4_vector_engine: data.level_4_vector_engine
      });
      setStateChangeReport(data.state_change_report || null);
      setGeneratedText("State Prepared. Please review the updated sliders and settings, then click Compile Episode.");
    } catch (err) {
      setGeneratedText("Error preparing sequence: " + err.message);
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePrepareRewrite = async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    setDirectorsNotes(null);
    setStateChangeReport(null);
    setCompilationMode("REWRITE_MODE");
    setGeneratedText("... Preparing State (Rewrite Mode) ...");
    
    try {
      const snapshotJSON = exportSnapshot();
      const parsedState = JSON.parse(snapshotJSON);
      
      const response = await fetch('/api/prepare-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          global_state: parsedState.current_state,
          mode: 'REWRITE_MODE',
          custom_notes: customNotes,
          use_director_critique: useDirectorCritique,
          director_critique: { critique: directorsNotes?.critique, recommended_slider_adjustments: rewriteSliders },
          previous_episode_text: generatedText,
          cumulative_synopsis: parsedState.current_state.level_1_5_saga.cumulative_synopsis
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      updateState({
        level_1_kernel: data.level_1_kernel, 
        level_1_5_saga: data.level_1_5_saga,
        level_2_domain: data.level_2_domain, 
        level_3_actor_cards: transformActorArraysToObjects(data.level_3_actor_cards),
        level_4_vector_engine: data.level_4_vector_engine
      });
      setStateChangeReport(data.state_change_report || null);
      setGeneratedText("Rewrite State Prepared. Please review the updated sliders and settings, then click Compile Episode.");
    } catch (err) {
      setGeneratedText("Error preparing rewrite: " + err.message);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleCompileEpisode = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    
    let currentCompilationMode = compilationMode;
    let currentRewriteSliders = rewriteSliders;
    let draftCount = 1;
    const MAX_DRAFTS = 3;
    let finalResultText = "";
    
    const snapshotJSON = exportSnapshot();
    const parsedState = JSON.parse(snapshotJSON);
    let loopState = parsedState.current_state;
    let loopStateChangeReport = stateChangeReport;
    let loopDirectorCritique = currentCompilationMode === 'REWRITE_MODE' ? directorsNotes?.critique : null;
    
    try {
      while (draftCount <= MAX_DRAFTS) {
        setGeneratedText(`... Executing Level 4 Vector Engine (Draft ${draftCount}) ...`);
        
        const lastHistoryItem = loopState.level_1_5_saga?.episode_history?.slice(-1)[0];
        const previousEpisodeText = lastHistoryItem ? lastHistoryItem.text : null;
        const sagaDigest = loopState.level_1_5_saga?.cumulative_synopsis || null;

        // 1. Generate Draft
        const result = await compileEpisode(
          loopState, 
          previousEpisodeText,
          sagaDigest,
          currentCompilationMode === 'REWRITE_MODE' ? currentRewriteSliders : null, 
          currentCompilationMode, 
          customNotes, 
          loopStateChangeReport,
          loopDirectorCritique
        );
        finalResultText = result;
        setGeneratedText(`... Evaluating Draft ${draftCount} ...`);
        
        // 2. Evaluate Draft
        setIsEvaluating(true);
        let evalData = null;
        try {
          const response = await fetch('/api/evaluate-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              episode_text: result,
              global_state: loopState
            })
          });
          evalData = await response.json();
          if (evalData.success) {
            setDirectorsNotes(evalData);
            if (evalData.recommended_slider_adjustments) {
              currentRewriteSliders = evalData.recommended_slider_adjustments;
              setRewriteSliders(evalData.recommended_slider_adjustments);
            }
          }
        } catch (err) {
          console.error("Error auto-evaluating story: " + err.message);
        } finally {
          setIsEvaluating(false);
        }

        // 3. Threshold Check
        let passed = false;
        if (evalData && evalData.success) {
          const { pacing_density, character_realism, causal_logic, thematic_resonance, captivation, structural_novelty } = evalData;
          if (pacing_density >= 8 && character_realism >= 8 && causal_logic >= 8 && thematic_resonance >= 8 && captivation >= 8 && structural_novelty >= 8) {
            passed = true;
          }
        }

        if (passed || draftCount === MAX_DRAFTS) {
          if (passed) {
            setGeneratedText(`Draft ${draftCount} passed Director's Review!\n\n${result}`);
          } else {
            setGeneratedText(`Max retries reached. Final Draft:\n\n${result}`);
          }
          break;
        } else {
          // Failed. Prepare Rewrite.
          setGeneratedText(`... Director rejected Draft ${draftCount}. Auto-preparing rewrite ...`);
          currentCompilationMode = 'REWRITE_MODE';
          loopDirectorCritique = evalData.critique;
          
          try {
            const prepResponse = await fetch('/api/prepare-scene', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                global_state: loopState,
                mode: 'REWRITE_MODE',
                custom_notes: customNotes,
                use_director_critique: true,
                director_critique: { critique: evalData.critique, recommended_slider_adjustments: currentRewriteSliders },
                previous_episode_text: finalResultText || generatedText,
                cumulative_synopsis: loopState.level_1_5_saga.cumulative_synopsis
              })
            });
            const prepData = await prepResponse.json();
            if (prepData.error) throw new Error(prepData.error);
            
            loopState = {
              ...loopState,
              level_1_kernel: prepData.level_1_kernel,
              level_1_5_saga: prepData.level_1_5_saga,
              level_2_domain: prepData.level_2_domain,
              level_3_actor_cards: transformActorArraysToObjects(prepData.level_3_actor_cards),
              level_4_vector_engine: prepData.level_4_vector_engine
            };
            loopStateChangeReport = prepData.state_change_report || null;
            setStateChangeReport(loopStateChangeReport);
            
            updateState({
              level_1_kernel: prepData.level_1_kernel, 
              level_1_5_saga: prepData.level_1_5_saga,
              level_2_domain: prepData.level_2_domain, 
              level_3_actor_cards: transformActorArraysToObjects(prepData.level_3_actor_cards),
              level_4_vector_engine: prepData.level_4_vector_engine
            });
            
          } catch (err) {
            setGeneratedText("Error preparing auto-rewrite: " + err.message);
            break;
          }
          
          draftCount++;
        }
      }
      
      // Update synopsis after the loop is done
      setIsUpdatingSynopsis(true);
      try {
        const response = await fetch('/api/synopsis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_text: finalResultText,
            previous_synopsis: saga.cumulative_synopsis || ""
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        updateState({
          level_1_5_saga: {
            ...saga,
            immediate_synopsis: data.immediate,
            cumulative_synopsis: compilationMode === 'SEQUEL_MODE' ? data.cumulative : (saga.cumulative_synopsis || "")
          }
        });
      } catch (err) {
        console.error("Error auto-updating synopsis: " + err.message);
      } finally {
        setIsUpdatingSynopsis(false);
      }

    } catch (err) {
      setGeneratedText("Error compiling episode: " + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleAdvanceTimeline = async (overrideGeneratedText = null, overrideState = null) => {
    const activeText = overrideGeneratedText || generatedText;
    if (!activeText) return;
    setDirectorsNotes(null);
    setShowReviewPanel(false);

    const currentState = overrideState ? overrideState : state.current_state;
    const currentSaga = currentState.level_1_5_saga;
    const currentKernel = currentState.level_1_kernel;

    // Detect if any "Teased" plot devices are ready to be resolved
    const currentVaultLedger = currentState.level_4_vector_engine?.chekhov_vault_ledger || [];
    const nextVaultLedger = currentVaultLedger.map(item => {
      if (item.causal_status === "Teased" && currentSaga.current_saga_index === item.resolution_episode) {
        return { ...item, causal_status: "Resolved" };
      }
      return item;
    });

    const nextEpisodeIndex = currentSaga.current_saga_index + 1;
    const targetEpisodes = currentKernel.target_episode_count || 0;
    const isEpilogue = currentKernel.progression_termination_mode === "fixed_grids" && nextEpisodeIndex >= targetEpisodes;

    updateState({
      level_4_vector_engine: {
        ...currentState.level_4_vector_engine,
        chekhov_vault_ledger: nextVaultLedger
      },
      level_1_5_saga: {
        ...currentSaga,
        current_saga_index: nextEpisodeIndex,
        is_epilogue_phase: isEpilogue,
        episode_history: [...(currentSaga.episode_history || []), activeText],
        immediate_synopsis: "",
        saga_progression_rail: [
          ...(currentSaga.saga_progression_rail || []),
          { episode: currentSaga.current_saga_index, capacity: engineCapacity }
        ]
      }
    });
    setGeneratedText("");
  };

  const handleSaveSaga = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/sagas/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          global_state: state.current_state,
          episode_history: saga.episode_history
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      alert("Saga correctly saved: " + data.filename);
    } catch (err) {
      alert("Error saving saga: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchAvailableSagas = async () => {
    try {
      const response = await fetch("/api/sagas/load");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAvailableSagas(data.files || []);
      setShowLoadDropdown(true);
    } catch (err) {
      alert("Error fetching sagas: " + err.message);
    }
  };

  const handleLoadSaga = async (filename) => {
    setIsLoadingArchive(true);
    setShowLoadDropdown(false);
    try {
      const response = await fetch("/api/sagas/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      applyNewState(data.global_state);
      alert("Saga successfully loaded!");
    } catch (err) {
      alert("Error loading saga: " + err.message);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const triggerSystemReset = () => {
    if (!window.confirm("Are you sure you want to wipe the current saga? This cannot be undone.")) return;
    
    applyNewState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));
    setGeneratedText("");
    setRawPremise("");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* ===================================== */}
        {/* SYSTEM TERMINAL                       */}
        {/* ===================================== */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 relative z-50 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-sm font-mono text-zinc-400">STORYBUILDER v8.1 MASTERPIECE MACHINE</h2>
          </div>
          
          <div className="flex items-center space-x-4 flex-wrap gap-y-2 justify-end">
            <button
              onClick={triggerSystemReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white border border-red-500/50 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 shadow-lg shadow-red-600/20"
            >
              <span>🚨</span>
              <span>ENTIRE SYSTEM RESET</span>
            </button>
            <button
              onClick={handleSaveSaga}
              disabled={isSaving || isGenerating || isCompiling}
              className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
            >
              {isSaving ? <span className="animate-spin">⏳</span> : <span>💾</span>}
              <span>{isSaving ? "Saving..." : "Save State to Disk"}</span>
            </button>

            <div className="relative">
              <button
                onClick={fetchAvailableSagas}
                disabled={isLoadingArchive || isGenerating || isCompiling}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
              >
                {isLoadingArchive ? <span className="animate-spin">⏳</span> : <span>📂</span>}
                <span>{isLoadingArchive ? "Loading..." : "Load Archive"}</span>
              </button>

              {showLoadDropdown && (
                <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-2 z-[60]">
                  <div className="flex justify-between items-center px-4 pb-2 border-b border-zinc-800 mb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Sagas</span>
                    <button onClick={() => setShowLoadDropdown(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
                  </div>
                  {availableSagas.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-500 italic">No saved sagas found.</div>
                  ) : (
                    availableSagas.map(filename => (
                      <button
                        key={filename}
                        onClick={() => handleLoadSaga(filename)}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-500/20 text-zinc-300 text-sm font-mono truncate transition-colors"
                      >
                        {filename}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* LEVEL 1: CONFIGURATION KERNEL         */}
        {/* ===================================== */}
        <div className="space-y-12">
          {/* Header */}
          <header className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Level 1
              </span>{" "}
              <span className="opacity-80">| Configuration Kernel</span>
            </h1>
            <p className="text-zinc-500 text-lg">
              Master control room for overarching narrative parameters.
            </p>
          </header>

          {/* AI Idea Spark Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950/20 to-purple-900/10 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-indigo-900/10 transition-all duration-500 hover:border-indigo-500/40 hover:shadow-indigo-900/20 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white">AI Idea Spark</h2>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-indigo-200/70">
                  Enter Raw Story Premise...
                </label>
                <textarea
                  value={rawPremise}
                  onChange={(e) => setRawPremise(e.target.value)}
                  placeholder="Enter a premise, or leave completely blank for pure AI Genesis..."
                  className="w-full h-32 bg-black/40 border border-indigo-500/30 text-zinc-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all duration-300 resize-none placeholder-zinc-600"
                />

                {/* Structured Brief Ingestion */}
                <div className="bg-black/20 border border-purple-500/20 rounded-xl p-5 space-y-4 mt-4">
                  <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-widest flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Structured Brief Ingestion</span>
                  </h3>
                  <textarea
                    value={structuredBrief}
                    onChange={(e) => setStructuredBrief(e.target.value)}
                    placeholder="Paste a structured story brief (Tragedy, Geography, Character Matrices, etc.) to map explicitly to the engine's state tree and lock those layers..."
                    className="w-full h-24 bg-black/40 border border-purple-500/30 text-zinc-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/80 transition-all duration-300 resize-none placeholder-zinc-600 text-sm"
                  />
                  <button
                    onClick={handleIngestBrief}
                    disabled={!structuredBrief.trim() || isIngesting}
                    className={`flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 transform shadow-lg ${
                      !structuredBrief.trim() || isIngesting
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white hover:-translate-y-0.5 hover:shadow-purple-500/25 active:translate-y-0 active:scale-[0.98]"
                    }`}
                  >
                    {isIngesting ? "Ingesting & Mapping Brief..." : "📥 Ingest Brief (Text)"}
                  </button>
                </div>

                {/* Saga Trajectory Controls */}
                <div className="bg-black/20 border border-indigo-500/20 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest flex items-center space-x-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    <span>Saga Trajectory</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Progression Termination Mode</label>
                      <select 
                        value={trajectoryMode}
                        onChange={(e) => setTrajectoryMode(e.target.value)}
                        className="bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm w-full md:w-2/3"
                      >
                        <option value="ORGANIC_CONVERGENCE">Organic Convergence (Engine decides)</option>
                        <option value="FIXED_GRID">Fixed Grid (Exact episode count)</option>
                        <option value="BOUNDED_RANGE">Bounded Range (Min-Max episodes)</option>
                      </select>
                    </div>

                    {trajectoryMode === "FIXED_GRID" && (
                      <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-medium text-zinc-400">Target Episodes</label>
                        <input 
                          type="number" 
                          min="1"
                          value={targetEpisodes}
                          onChange={(e) => setTargetEpisodes(parseInt(e.target.value) || 1)}
                          className="bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm w-full md:w-1/3"
                        />
                      </div>
                    )}

                    {trajectoryMode === "BOUNDED_RANGE" && (
                      <div className="flex space-x-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col space-y-2 flex-1 md:flex-none">
                          <label className="text-xs font-medium text-zinc-400">Min Episodes</label>
                          <input 
                            type="number" 
                            min="1"
                            value={minEpisodes}
                            onChange={(e) => setMinEpisodes(parseInt(e.target.value) || 1)}
                            className="bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm w-full"
                          />
                        </div>
                        <div className="flex flex-col space-y-2 flex-1 md:flex-none">
                          <label className="text-xs font-medium text-zinc-400">Max Episodes</label>
                          <input 
                            type="number" 
                            min="1"
                            value={maxEpisodes}
                            onChange={(e) => setMaxEpisodes(parseInt(e.target.value) || 1)}
                            className="bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Pre-Flight Entropy */}
                    <div className="flex flex-col space-y-2 pt-2 border-t border-indigo-500/10">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-zinc-400" title="Values > 7 strictly forbid standard tropes.">Narrative Entropy Seed (Variance)</label>
                        <span className="text-indigo-400 font-mono text-xs">{preFlightEntropy}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0"
                        max="10"
                        step="1"
                        value={preFlightEntropy}
                        onChange={(e) => setPreFlightEntropy(parseInt(e.target.value) || 0)}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                    
                    {/* Capacity Dial */}
                    <div className="flex flex-col space-y-2 pt-2 border-t border-indigo-500/10">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-zinc-400" title="Controls Unattended vs Hands-On generation.">Engine Capacity Preset</label>
                        <span className="text-indigo-400 font-mono text-xs">
                          {engineCapacity === 0 ? "0 (Unattended)" : engineCapacity === 50 ? "50 (Collaborative)" : "100 (Authored)"}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0"
                        max="100"
                        step="50"
                        value={engineCapacity}
                        onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 0)}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Unattended (0)</span>
                        <span>Collaborative (50)</span>
                        <span>Authored (100)</span>
                      </div>
                    </div>
                  </div>

                  {/* v8.1 Autobuild Guidelines */}
                  <div className="pt-4 border-t border-indigo-500/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">World Scale</label>
                      <select 
                        value={autobuildWorldScale}
                        onChange={(e) => setAutobuildWorldScale(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                      >
                        <option value="AI Default">AI Default (Auto-detect)</option>
                        <option value="intimate">Intimate (Single Room/Building)</option>
                        <option value="standard">Standard (City/Region)</option>
                        <option value="epic">Epic (Continental/Global)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Complexity Level</label>
                      <select 
                        value={autobuildComplexity}
                        onChange={(e) => setAutobuildComplexity(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                      >
                        <option value="AI Default">AI Default (Auto-detect)</option>
                        <option value="low">Low (Straightforward, linear)</option>
                        <option value="medium">Medium (Moderate branching, some factions)</option>
                        <option value="high">High (Complex politics, deep lore)</option>
                        <option value="extreme">Extreme (Massive interlocking matrices)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => updateKernel({ raw_spark_text: rawPremise })}
                    disabled={!rawPremise.trim()}
                    className={`flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      !rawPremise.trim()
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    💾 Save Premise (Manual)
                  </button>
                  <button
                    onClick={handleRefinePremise}
                    disabled={!rawPremise.trim() || isRefining}
                    className={`flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-300 transform shadow-lg ${
                      !rawPremise.trim() || isRefining
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:-translate-y-0.5 hover:shadow-emerald-500/25 active:translate-y-0 active:scale-[0.98]"
                    }`}
                  >
                    {isRefining ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Refining Spark...
                      </span>
                    ) : (
                      "✨ Refine Premise"
                    )}
                  </button>
                  <button
                    onClick={handleAutoConfigure}
                    disabled={isGenerating}
                    className={`flex items-center justify-center w-full sm:w-auto px-8 py-3 rounded-xl font-medium transition-all duration-300 transform shadow-lg ${
                      isGenerating
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:-translate-y-0.5 hover:shadow-indigo-500/25 active:translate-y-0 active:scale-[0.98]"
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Synthesizing...
                      </span>
                    ) : (
                      "✨ Auto-Build Framework"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Manual Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Core Regulators */}
            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-medium text-white">Core Regulators</h3>
                <button
                  onClick={() => updateHybridLocks({ level_1_sliders: !hybridLocks.level_1_sliders })}
                  className={`p-2 rounded-lg transition-all ${hybridLocks.level_1_sliders ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'}`}
                  title="Lock/Unlock AI Overwrites"
                >
                  {hybridLocks.level_1_sliders ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                  )}
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-400">Narrative Entropy Index</label>
                  <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded-md text-xs">
                    {kernel.narrative_entropy_index?.toFixed ? kernel.narrative_entropy_index.toFixed(1) : kernel.narrative_entropy_index}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={kernel.narrative_entropy_index}
                  onChange={(e) => updateKernel({ narrative_entropy_index: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Order</span>
                  <span>Chaos</span>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-zinc-400">Global Dialogue Density</label>
                    <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded-md text-xs">
                      {kernel.global_dialogue_density !== undefined ? kernel.global_dialogue_density : 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={kernel.global_dialogue_density !== undefined ? kernel.global_dialogue_density : 0}
                    onChange={(e) => updateKernel({ global_dialogue_density: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>Visual Only (0)</span>
                    <span>Heavy Dialogue (10)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-400">User Agency Regulator</label>
                <select
                  value={kernel.user_agency_regulator}
                  onChange={(e) => updateKernel({ user_agency_regulator: e.target.value })}
                  className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                >
                  <option value="automated | hybrid | manual" disabled>Select Agency Mode...</option>
                  <option value="automated">Automated</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-400">Scope Valve</label>
                  <div className="flex bg-black/40 border border-zinc-800 rounded-xl p-1 relative">
                    <button onClick={() => updateKernel({ scope_valve: "micro_stakes" })} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all duration-300 z-10 ${kernel.scope_valve === "micro_stakes" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Micro</button>
                    <button onClick={() => updateKernel({ scope_valve: "macro_stakes" })} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all duration-300 z-10 ${kernel.scope_valve === "macro_stakes" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Macro</button>
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-800 rounded-lg shadow-sm transition-all duration-300 ${kernel.scope_valve === "macro_stakes" ? "left-[calc(50%+2px)]" : "left-1"}`}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-400">Protagonist Mode</label>
                  <div className="flex bg-black/40 border border-zinc-800 rounded-xl p-1 relative">
                    <button onClick={() => updateKernel({ protagonist_distribution_mode: "single_focus" })} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all duration-300 z-10 ${kernel.protagonist_distribution_mode === "single_focus" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Single</button>
                    <button onClick={() => updateKernel({ protagonist_distribution_mode: "ensemble_round_robin" })} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all duration-300 z-10 ${kernel.protagonist_distribution_mode === "ensemble_round_robin" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Ensemble</button>
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-800 rounded-lg shadow-sm transition-all duration-300 ${kernel.protagonist_distribution_mode === "ensemble_round_robin" ? "left-[calc(50%+2px)]" : "left-1"}`}></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Narrative Trajectory */}
            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8">
              <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-4">Narrative Trajectory</h3>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-400">Progression Termination Mode</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={kernel.progression_termination_mode}
                    onChange={(e) => updateKernel({ progression_termination_mode: e.target.value })}
                    className="flex-1 bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                  >
                    <option value="fixed_grids | organic_convergence" disabled>Select Mode...</option>
                    <option value="fixed_grids">Fixed Grids</option>
                    <option value="organic_convergence">Organic Convergence</option>
                  </select>

                  {kernel.progression_termination_mode === "fixed_grids" && (
                    <div className="w-full sm:w-1/3 animate-in fade-in slide-in-from-right-4 duration-300">
                      <input
                        type="number"
                        min="1"
                        value={kernel.target_episode_count || 1}
                        onChange={(e) => updateKernel({ target_episode_count: parseInt(e.target.value) || 1 })}
                        className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-center"
                        placeholder="Episodes"
                        title="Target Episode Count"
                      />
                    </div>
                  )}
                </div>
                {["organic_convergence", "Organic Convergence"].includes(kernel.progression_termination_mode) && (
                  <div className="flex items-center space-x-2 mt-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-sm italic text-emerald-300/80">
                      Open-Ended: Terminates automatically upon narrative resolution.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-400">Structural Rhythm</label>
                  <select
                    value={kernel.structural_rhythm_preset}
                    onChange={(e) => updateKernel({ structural_rhythm_preset: e.target.value })}
                    className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                  >
                    <option value="slow_burn | relentless_compression" disabled>Select Rhythm...</option>
                    <option value="slow_burn">Slow Burn</option>
                    <option value="relentless_compression">Relentless Compression</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-400">Ending Payload</label>
                  <select
                    value={kernel.ending_payload_controller}
                    onChange={(e) => updateKernel({ ending_payload_controller: e.target.value })}
                    className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                  >
                    <option value="open | closed_finality | closed_loop" disabled>Select Ending...</option>
                    <option value="open">Open</option>
                    <option value="closed_finality">Closed Finality</option>
                    <option value="closed_loop">Closed Loop</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Dialectic Matrix */}
            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8 lg:col-span-2 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"></div>
                <div className="absolute top-1/2 right-0 w-1/2 h-px bg-gradient-to-l from-transparent via-white to-transparent"></div>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-medium text-white">Dialectic Matrix</h3>
                  <button
                    onClick={() => updateHybridLocks({ level_1_dialectic: !hybridLocks.level_1_dialectic })}
                    className={`p-1.5 rounded-lg transition-all ${hybridLocks.level_1_dialectic ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'}`}
                    title="Lock/Unlock AI Overwrites"
                  >
                    {hybridLocks.level_1_dialectic ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                    )}
                  </button>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-black/40 px-4 py-2 rounded-xl border border-zinc-700/50">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status Node</span>
                  <select
                    value={kernel.dialectic_matrix.thematic_status_node}
                    onChange={(e) => updateDialectic("thematic_status_node", e.target.value)}
                    className="bg-transparent text-indigo-400 font-semibold focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="equilibrium | confrontation | synthesis" disabled>Select Node...</option>
                    <option value="equilibrium">Equilibrium</option>
                    <option value="confrontation">Confrontation</option>
                    <option value="synthesis">Synthesis</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3 group">
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-400 group-focus-within:text-indigo-400 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span>Core Claim (Thesis)</span>
                  </label>
                  <textarea
                    value={kernel.dialectic_matrix.core_claim === "string" ? "" : kernel.dialectic_matrix.core_claim}
                    onChange={(e) => updateDialectic("core_claim", e.target.value)}
                    placeholder="e.g. Order is necessary for survival."
                    className="w-full h-24 bg-black/40 border border-zinc-700/80 text-zinc-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none shadow-inner shadow-black/50"
                  />
                </div>

                <div className="space-y-3 group">
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-400 group-focus-within:text-purple-400 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span>Counter Claim (Antithesis)</span>
                  </label>
                  <textarea
                    value={kernel.dialectic_matrix.counter_claim === "string" ? "" : kernel.dialectic_matrix.counter_claim}
                    onChange={(e) => updateDialectic("counter_claim", e.target.value)}
                    placeholder="e.g. Total order results in stagnation and death."
                    className="w-full h-24 bg-black/40 border border-zinc-700/80 text-zinc-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none shadow-inner shadow-black/50"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ===================================== */}
        {/* LEVEL 1.5: MACRO-SAGA ROADMAP         */}
        {/* ===================================== */}
        <div className="space-y-8 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
          <header className="space-y-2 border-b border-zinc-800 pb-4 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-light text-white tracking-tight">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Level 1.5
                </span>{" "}
                <span className="opacity-80">| Macro-Saga Roadmap</span>
              </h2>
              <p className="text-zinc-500 text-sm">
                Timeline progression and inter-scene buffer control.
              </p>
            </div>
            {["organic_convergence", "Organic Convergence"].includes(kernel.progression_termination_mode) && (
              <button
                onClick={() => updateSaga({ is_final_episode: true })}
                disabled={saga.is_final_episode}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  saga.is_final_episode
                    ? "bg-emerald-900/50 text-emerald-500/50 cursor-not-allowed border border-emerald-900/50"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 hover:border-emerald-400 hover:-translate-y-0.5 shadow-lg shadow-emerald-900/20"
                }`}
              >
                {saga.is_final_episode ? "Convergence Triggered" : "🛑 Trigger Convergence (End Saga)"}
              </button>
            )}
          </header>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-400">Saga Progression Rail</h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-zinc-500">Buffer Latch:</span>
                <button
                  onClick={() => updateSaga({ inter_scene_buffer_latch: !saga.inter_scene_buffer_latch })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                    saga.inter_scene_buffer_latch ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      saga.inter_scene_buffer_latch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Timeline UI */}
            <div className="relative pt-8 pb-4 px-4 w-full overflow-x-auto no-scrollbar">
              {["organic_convergence", "Organic Convergence"].includes(kernel.progression_termination_mode) ? (
                /* Infinite Rail */
                <div className="flex items-center w-full min-w-[500px]">
                  {Array.from({ length: Math.max(5, saga.current_saga_index + 3) }).map((_, i) => {
                    const isCompleted = i < saga.current_saga_index;
                    const isCurrent = i === saga.current_saga_index;
                    return (
                      <div key={i} className="flex-1 flex items-center relative group">
                        <div className={`h-1 w-full ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-800'} transition-colors duration-500`}></div>
                        <button
                          onClick={() => updateSaga({ current_saga_index: i })}
                          className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-zinc-900 flex items-center justify-center transition-all duration-300 z-10 ${
                            isCurrent 
                              ? 'bg-emerald-400 scale-125 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                              : isCompleted 
                                ? 'bg-emerald-600 hover:bg-emerald-500' 
                                : 'bg-zinc-700 hover:bg-zinc-600'
                          }`}
                        >
                          {isCompleted && !isCurrent && <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono transition-colors ${isCurrent ? 'text-emerald-400 font-bold' : 'text-zinc-600'}`}>
                          EP.{i + 1}
                        </span>
                      </div>
                    );
                  })}
                  {/* Fading end gradient */}
                  <div className="w-32 h-1 bg-gradient-to-r from-zinc-800 to-transparent"></div>
                </div>
              ) : (
                /* Fixed Grids Rail */
                <div className="flex items-center w-full min-w-[500px]">
                  {Array.from({ length: kernel.target_episode_count }).map((_, i) => {
                    const isCompleted = i < saga.current_saga_index;
                    const isCurrent = i === saga.current_saga_index;
                    const isLast = i === kernel.target_episode_count - 1;
                    return (
                      <div key={i} className={`flex items-center relative group ${isLast ? 'flex-none' : 'flex-1'}`}>
                        {!isLast && <div className={`h-1 w-full ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-800'} transition-colors duration-500`}></div>}
                        <button
                          onClick={() => updateSaga({ current_saga_index: i })}
                          className={`absolute ${isLast ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} w-6 h-6 rounded-full border-4 border-zinc-900 flex items-center justify-center transition-all duration-300 z-10 ${
                            isCurrent 
                              ? 'bg-emerald-400 scale-125 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                              : isCompleted 
                                ? 'bg-emerald-600 hover:bg-emerald-500' 
                                : 'bg-zinc-700 hover:bg-zinc-600'
                          }`}
                        >
                          {isCompleted && !isCurrent && <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`absolute -top-6 ${isLast ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} text-xs font-mono transition-colors ${isCurrent ? 'text-emerald-400 font-bold' : 'text-zinc-600'}`}>
                          EP.{i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Masterpiece Machine v8.1 Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/50">
              {/* World Scale */}
              <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-zinc-800/30">
                <label className="block text-sm font-medium text-zinc-400">World Scale</label>
                <select
                  value={kernel.world_scale || "standard"}
                  onChange={(e) => updateKernel({ world_scale: e.target.value })}
                  className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                >
                  <option value="intimate">Intimate (Single Room/Building)</option>
                  <option value="standard">Standard (City/Region)</option>
                  <option value="epic">Epic (Continental/Global)</option>
                </select>
                <p className="text-xs text-zinc-500">Determines if the global faction matrix possesses massive military/political leverage.</p>
              </div>

              {/* Temporal Iteration Mode */}
              <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-zinc-800/30">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-400">Temporal Iteration (Time Loop)</label>
                  <button
                    onClick={() => updateSaga({ temporal_iteration_mode: !saga.temporal_iteration_mode })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      saga.temporal_iteration_mode ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${saga.temporal_iteration_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-xs text-zinc-500">If active, character deaths cause a physical world reset while preserving their epistemic ledger (memories).</p>
              </div>

              {/* Convergence Override */}
              <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-zinc-800/30">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-400">Convergence Override</label>
                  <button
                    onClick={() => updateSaga({
                      geographical_context_demultiplexer: {
                        ...saga.geographical_context_demultiplexer,
                        convergence_override_active: !saga.geographical_context_demultiplexer?.convergence_override_active
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      saga.geographical_context_demultiplexer?.convergence_override_active ? 'bg-red-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${saga.geographical_context_demultiplexer?.convergence_override_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Suspends Round-Robin POV jumping. Locks camera onto a single massive collision event.</p>
              </div>

              {/* Rumor Queue */}
              <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-zinc-800/30">
                <label className="block text-sm font-medium text-zinc-400">Rumor Propagation Queue</label>
                <textarea
                  value={saga.rumor_propagation_queue?.join("\n") || ""}
                  onChange={(e) => updateSaga({ rumor_propagation_queue: e.target.value.split("\n").filter(r => r.trim() !== "") })}
                  placeholder="Enter rumors (one per line) to propagate as hearsay..."
                  className="w-full h-20 bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-lg p-3 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm resize-none"
                />
                <p className="text-xs text-zinc-500">Events from isolated lanes to inject as background hearsay.</p>
              </div>
            </div>

          </div>
        </div>

        {/* ===================================== */}
        {/* LEVEL 2: THE DOMAIN MATRIX            */}
        {/* ===================================== */}
        <div className="space-y-12">
          <header className="space-y-2 pt-12 border-t border-zinc-800/50">
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Level 2
              </span>{" "}
              <span className="opacity-80">| The Domain Matrix</span>
            </h2>
            <p className="text-zinc-500 text-lg">
              Architect the systemic rules and active environment (The Cage).
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8">
              <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-4">Systemic Architecture</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-400">Hegemony Mass</label>
                  <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-md text-xs">
                    {domain.hegemony_node.mass_slider.toFixed ? domain.hegemony_node.mass_slider.toFixed(1) : domain.hegemony_node.mass_slider}
                  </span>
                </div>
                <input
                  type="range" min="0" max="10" step="0.1"
                  value={domain.hegemony_node.mass_slider}
                  onChange={(e) => updateDomain({ hegemony_node: { ...domain.hegemony_node, mass_slider: parseFloat(e.target.value) } })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-400">Environmental Animacy</label>
                  <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-md text-xs">
                    {domain.environmental_animacy_scalar.toFixed ? domain.environmental_animacy_scalar.toFixed(1) : domain.environmental_animacy_scalar}
                  </span>
                </div>
                <input
                  type="range" min="0" max="10" step="0.1"
                  value={domain.environmental_animacy_scalar}
                  onChange={(e) => updateDomain({ environmental_animacy_scalar: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-400">Objectivity Regulator</label>
                <select
                  value={domain.objectivity_regulator_switch}
                  onChange={(e) => updateDomain({ objectivity_regulator_switch: e.target.value })}
                  className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                >
                  <option value="subjective_mirror | absolute_objective" disabled>Select Regulator...</option>
                  <option value="subjective_mirror">Subjective Mirror</option>
                  <option value="absolute_objective">Absolute Objective</option>
                </select>
              </div>
            </section>

            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8">
              <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-4">Linguistic Dictionary</h3>
              
              <TagInput 
                label="Tier 1 Genre" 
                tags={domain.dictionary_cascade.tier_1_genre} 
                onTagsChange={(tags) => updateDictionary("tier_1_genre", tags)} 
                placeholder="e.g. Cyberpunk"
              />

              <TagInput 
                label="Tier 2 Aesthetic" 
                tags={domain.dictionary_cascade.tier_2_aesthetic} 
                onTagsChange={(tags) => updateDictionary("tier_2_aesthetic", tags)} 
                placeholder="e.g. Neon Noir"
              />

              <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-400">Tier 3 Density Scalar</label>
                  <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-md text-xs">
                    {domain.dictionary_cascade.tier_3_density_scalar.toFixed ? domain.dictionary_cascade.tier_3_density_scalar.toFixed(1) : domain.dictionary_cascade.tier_3_density_scalar}
                  </span>
                </div>
                <input
                  type="range" min="0" max="10" step="0.1"
                  value={domain.dictionary_cascade.tier_3_density_scalar}
                  onChange={(e) => updateDictionary("tier_3_density_scalar", parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </section>

            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8 lg:col-span-2 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent"></div>
              </div>

              <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-4 relative z-10">Active Viewport Box</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-3 group">
                    <label className="block text-sm font-medium text-zinc-400 transition-colors group-focus-within:text-emerald-400">Current Location ID</label>
                    <textarea
                      value={domain.active_viewport_box.current_location_id === "string" ? "" : domain.active_viewport_box.current_location_id}
                      onChange={(e) => updateViewport("current_location_id", e.target.value)}
                      placeholder="e.g. loc_neon_city_01"
                      className="w-full bg-black/40 border border-zinc-700/80 text-emerald-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono shadow-inner shadow-black/50 resize-none overflow-hidden"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-3 group">
                    <label className="block text-sm font-medium text-zinc-400 transition-colors group-focus-within:text-emerald-400">Local Container Volume</label>
                    <textarea
                      value={domain.active_viewport_box.local_container_volume === "string" ? "" : domain.active_viewport_box.local_container_volume}
                      onChange={(e) => updateViewport("local_container_volume", e.target.value)}
                      placeholder="e.g. High-density urban sprawl"
                      className="w-full bg-black/40 border border-zinc-700/80 text-zinc-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner shadow-black/50 resize-none overflow-hidden"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <TagInput 
                    label="Local Prop Registry" 
                    tags={domain.active_viewport_box.local_prop_registry} 
                    onTagsChange={(tags) => updateViewport("local_prop_registry", tags)} 
                    placeholder="Add prop..."
                  />
                </div>
              </div>
            </section>

            {/* Masterpiece Machine Level 2 Toggles */}
            <section className="col-span-1 md:col-span-2 pt-6 border-t border-zinc-800/50">
              <h3 className="text-xl font-medium text-white mb-6 border-l-4 border-emerald-500 pl-4">v8.1 Master Toggles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Atmospheric MA Override */}
                <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-zinc-800/30">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-zinc-400">Atmospheric 'Ma' Override</label>
                    <button
                      onClick={() => updateEngine({ atmospheric_ma_override: !engine.atmospheric_ma_override })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        engine.atmospheric_ma_override ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${engine.atmospheric_ma_override ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">Studio Ghibli Mode: Prioritizes negative space, environmental focus, and silent pacing.</p>
                </div>

                {/* Universal Laws Ledger */}
                <div className="space-y-3 bg-black/20 p-5 rounded-2xl border border-zinc-800/30">
                  <label className="block text-sm font-medium text-zinc-400">Universal Laws Ledger</label>
                  <textarea
                    value={domain.universal_laws_ledger?.join("\n") || ""}
                    onChange={(e) => updateDomain({ universal_laws_ledger: e.target.value.split("\n").filter(l => l.trim() !== "") })}
                    placeholder="Enter absolute physical laws (e.g. Magic costs blood)..."
                    className="w-full h-20 bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-lg p-3 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm resize-none"
                  />
                  <p className="text-xs text-zinc-500">Mathematical laws the AI is strictly forbidden from breaking.</p>
                </div>

              </div>
            </section>
          </div>
        </div>

        {/* ===================================== */}
        {/* LEVEL 2.5: THEMATIC RESONANCE BRIDGE  */}
        {/* ===================================== */}
        <div className="space-y-8 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl">
          <header className="space-y-2 border-b border-zinc-800 pb-4">
            <h2 className="text-3xl font-light text-white tracking-tight">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Level 2.5
              </span>{" "}
              <span className="opacity-80">| Thematic Resonance Bridge</span>
            </h2>
            <p className="text-zinc-500 text-sm">
              Thematic Mirroring controllers.
            </p>
          </header>

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => updateBridge({ is_active: !bridge.thematic_mirroring.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                bridge.thematic_mirroring.is_active ? 'bg-cyan-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bridge.thematic_mirroring.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-zinc-300 text-sm font-medium">Thematic Mirroring Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-400">Influence Factor</label>
                <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-1 rounded-md text-xs">
                  {bridge.thematic_mirroring.influence_factor.toFixed ? bridge.thematic_mirroring.influence_factor.toFixed(1) : bridge.thematic_mirroring.influence_factor}
                </span>
              </div>
              <input
                type="range" min="0" max="10" step="0.1"
                value={bridge.thematic_mirroring.influence_factor}
                onChange={(e) => updateBridge({ influence_factor: parseFloat(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-400">Sync Mode</label>
              <select
                value={bridge.thematic_mirroring.sync_mode.toLowerCase()}
                onChange={(e) => updateBridge({ sync_mode: e.target.value })}
                className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer"
              >
                <option value="passive">Passive</option>
                <option value="reactive">Reactive</option>
                <option value="projective">Projective</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* LEVEL 3: THE ACTOR CARDS              */}
        {/* ===================================== */}
        <div className="space-y-12">
          <header className="space-y-2 pt-12 border-t border-zinc-800/50 flex flex-col md:flex-row md:items-end justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400">
                    Level 3
                  </span>{" "}
                  <span className="opacity-80">| Actor Cards</span>
                </h2>
                <p className="text-zinc-500 text-lg mt-2">
                  The emotional cores and narrative agents (The Heart).
                </p>
              </div>
              <button
                onClick={() => updateHybridLocks({ level_3_actors: !hybridLocks.level_3_actors })}
                className={`p-2 rounded-lg transition-all self-start md:self-auto ${hybridLocks.level_3_actors ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'}`}
                title="Lock/Unlock AI Overwrites"
              >
                {hybridLocks.level_3_actors ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                )}
              </button>
            </div>
            <button
              onClick={addCharacter}
              className="mt-6 md:mt-0 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Character</span>
            </button>
          </header>

          {/* Actor Registry */}
          <div className="space-y-8">
            {Object.entries(actors.pov_characters || {}).length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-3xl p-12 text-center">
                <p className="text-zinc-500">No actors in the registry. Click 'New Character' to add one.</p>
              </div>
            ) : (
              Object.entries(actors.pov_characters || {}).map(([id, char]) => (
                <article key={id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => deleteCharacter(id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    
                    {/* Left Column: Identity & Blueprint */}
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-rose-400 uppercase tracking-widest">
                          The Shield (Name/Alias)
                        </label>
                        <input
                          type="text"
                          value={char.the_shield}
                          onChange={(e) => updateCharacter(id, { the_shield: e.target.value })}
                          placeholder="e.g. Kaelen Vanguard"
                          className="w-full bg-black/40 border-b border-zinc-700 focus:border-rose-500 text-2xl font-bold text-white px-2 py-3 focus:outline-none transition-colors placeholder-zinc-700"
                        />
                      </div>

                      <div className="space-y-6 bg-black/20 p-6 rounded-2xl border border-zinc-800/50">
                        <h4 className="text-sm font-medium text-zinc-400 flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          <span>The Blueprint</span>
                        </h4>
                        
                        <div className="space-y-3">
                          <label className="block text-xs font-medium text-zinc-500">Ghost (Past Trauma)</label>
                          <textarea
                            value={char.the_blueprint.ghost}
                            onChange={(e) => updateCharacter(id, { the_blueprint: { ...char.the_blueprint, ghost: e.target.value } })}
                            placeholder="e.g. Failed to save the colony ship."
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-lg p-3 focus:outline-none focus:border-rose-500/50 transition-colors text-sm resize-none overflow-hidden"
                            rows={1}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs font-medium text-zinc-500">Lie (False Belief)</label>
                          <textarea
                            value={char.the_blueprint.lie}
                            onChange={(e) => updateCharacter(id, { the_blueprint: { ...char.the_blueprint, lie: e.target.value } })}
                            placeholder="e.g. Trust is a vulnerability."
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-lg p-3 focus:outline-none focus:border-rose-500/50 transition-colors text-sm resize-none overflow-hidden"
                            rows={1}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                          />
                        </div>

                        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-zinc-400">Desire Inversion</label>
                            <p className="text-[10px] text-zinc-500">Force irrationality (Micro-Want overrides Macro-Want).</p>
                          </div>
                          <button
                            onClick={() => updateCharacter(id, { desire_inversion_active: !char.desire_inversion_active })}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                              char.desire_inversion_active ? 'bg-rose-500' : 'bg-zinc-700'
                            }`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${char.desire_inversion_active ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Psychological Profile */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2 flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          <span>Psychological Profile</span>
                        </h4>

                        {/* Interactive Character Map */}
                        <div className="flex flex-col items-center space-y-2 bg-black/20 rounded-2xl p-4 border border-zinc-800/50">
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">Interactive Profile Map</span>
                          <svg 
                            width="240" 
                            height="240" 
                            className="select-none touch-none"
                            onPointerMove={handleCharPointerMove}
                            onPointerUp={handleCharPointerUp}
                            onPointerLeave={handleCharPointerUp}
                            viewBox="0 0 300 300"
                          >
                            {/* Concentric grid circles */}
                            {[18, 36, 54, 72, 90].map((r, i) => (
                              <circle key={i} cx="150" cy="150" r={r} fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4,4" />
                            ))}
                            
                            {/* Radial axis lines */}
                            {charKeys.map((_, i) => {
                              const pt = getRadarPoint(i, 10);
                              return (
                                <line key={i} x1="150" y1="150" x2={pt.x} y2={pt.y} stroke="#27272a" strokeWidth="1" />
                              );
                            })}
                            
                            {/* Axis Labels */}
                            {charLabels.map((lbl, i) => {
                              const pt = getRadarPoint(i, 11.5);
                              let anchor = "middle";
                              if (i === 1 || i === 2) anchor = "start";
                              if (i === 3 || i === 4) anchor = "end";
                              return (
                                <text key={i} x={pt.x} y={pt.y + 4} fill="#a1a1aa" fontSize="11" fontFamily="monospace" fontWeight="semibold" textAnchor={anchor}>
                                  {lbl}
                                </text>
                              );
                            })}
                            
                            {/* Score polygon */}
                            <polygon 
                              points={charKeys.map((key, i) => {
                                const val = char.kinesic_profile ? char.kinesic_profile[key] : (key === 'verbal_density' ? 5 : 5);
                                const pt = getRadarPoint(i, val);
                                return `${pt.x},${pt.y}`;
                              }).join(" ")}
                              fill="rgba(99, 102, 241, 0.2)"
                              stroke="#6366f1"
                              strokeWidth="2"
                            />
                            
                            {/* Interaction drag handles */}
                            {charKeys.map((key, i) => {
                              const val = char.kinesic_profile ? char.kinesic_profile[key] : (key === 'verbal_density' ? 5 : 5);
                              const pt = getRadarPoint(i, val);
                              return (
                                <circle
                                  key={key} cx={pt.x} cy={pt.y} r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5"
                                  className="cursor-grab active:cursor-grabbing"
                                  onPointerDown={handleCharPointerDown(id, i)}
                                />
                              );
                            })}
                          </svg>
                        </div>
                        
                        <div className="space-y-6">
                          {[
                            { key: "action_bias", label: "Action Bias: Methodical ➔ Impulsive" },
                            { key: "morality_empathy", label: "Morality/Empathy: Ruthless ➔ Martyr" },
                            { key: "emotional_armor", label: "Emotional Armor: Vulnerable ➔ Detached" },
                            { key: "thematic_alignment", label: "Thematic Alignment: Subversive ➔ Avatar" },
                            { key: "verbal_density", label: "Verbal Density: Mute ➔ Graphomanic" }
                          ].map(trait => {
                            const val = char.kinesic_profile ? char.kinesic_profile[trait.key] : (trait.key === 'verbal_density' ? 0 : 5);
                            return (
                              <div key={trait.key} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-xs font-medium text-zinc-500">{trait.label}</label>
                                  <span className="text-indigo-400 font-mono text-xs">
                                    {val.toFixed ? val.toFixed(1) : val}
                                  </span>
                                </div>
                                <input
                                  type="range" min="0" max="10" step="1"
                                  value={val}
                                  onChange={(e) => {
                                    const currentProfile = char.kinesic_profile || { morality_empathy: 5, action_bias: 5, emotional_armor: 5, thematic_alignment: 5, verbal_density: 5 };
                                    updateCharacter(id, {
                                      kinesic_profile: { ...currentProfile, [trait.key]: parseInt(e.target.value) }
                                    });
                                  }}
                                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Directorial Directive Synthesis */}
                        <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl space-y-2">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 block">Directorial Directive</span>
                          <p className="text-xs text-indigo-200/80 leading-relaxed font-serif italic">
                            {synthesizeDirectorialDirective(char.kinesic_profile)}
                          </p>
                        </div>
                      </div>

                      {/* 3-Tier Desire Stack */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2">3-Tier Desire Stack</h4>
                        <div className="space-y-4">
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-xs font-bold text-rose-500/50">MACRO</span>
                            <textarea
                              value={char.three_tier_desire_stack.macro_want}
                              onChange={(e) => updateCharacter(id, { three_tier_desire_stack: { ...char.three_tier_desire_stack, macro_want: e.target.value } })}
                              placeholder="Overarching life goal..."
                              className="w-full bg-black/40 border border-zinc-800/80 text-zinc-200 rounded-xl py-3 pl-16 pr-4 focus:outline-none focus:ring-1 focus:ring-rose-500/50 text-sm resize-none overflow-hidden"
                              rows={1}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }}
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-xs font-bold text-rose-500/50">MESO</span>
                            <textarea
                              value={char.three_tier_desire_stack.meso_want}
                              onChange={(e) => updateCharacter(id, { three_tier_desire_stack: { ...char.three_tier_desire_stack, meso_want: e.target.value } })}
                              placeholder="Current arc objective..."
                              className="w-full bg-black/40 border border-zinc-800/80 text-zinc-200 rounded-xl py-3 pl-16 pr-4 focus:outline-none focus:ring-1 focus:ring-rose-500/50 text-sm resize-none overflow-hidden"
                              rows={1}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }}
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-xs font-bold text-rose-500/50">MICRO</span>
                            <textarea
                              value={char.three_tier_desire_stack.micro_want}
                              onChange={(e) => updateCharacter(id, { three_tier_desire_stack: { ...char.three_tier_desire_stack, micro_want: e.target.value } })}
                              placeholder="Immediate scene objective..."
                              className="w-full bg-black/40 border border-zinc-800/80 text-zinc-200 rounded-xl py-3 pl-16 pr-4 focus:outline-none focus:ring-1 focus:ring-rose-500/50 text-sm resize-none overflow-hidden"
                              rows={1}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Matrices & Modulators */}
                    <div className="space-y-10">
                      
                      {/* 4-Axis Friction Matrix */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2">4-Axis Friction Matrix</h4>
                        
                        {[
                          { key: "axis_1_ideological", label: "Ideological Tension" },
                          { key: "axis_2_operational", label: "Operational Friction" },
                          { key: "axis_3_relational", label: "Relational Strain" },
                          { key: "axis_4_existential", label: "Existential Dread" }
                        ].map((axis) => (
                          <div key={axis.key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-medium text-zinc-500">{axis.label}</label>
                              <span className="text-rose-400 font-mono text-xs">
                                {char.four_axis_friction_matrix[axis.key].toFixed ? char.four_axis_friction_matrix[axis.key].toFixed(1) : char.four_axis_friction_matrix[axis.key]}
                              </span>
                            </div>
                            <input
                              type="range" min="0" max="10" step="0.1"
                              value={char.four_axis_friction_matrix[axis.key]}
                              onChange={(e) => updateCharacter(id, {
                                four_axis_friction_matrix: { ...char.four_axis_friction_matrix, [axis.key]: parseFloat(e.target.value) }
                              })}
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Dynamic Inventory */}
                      <div className="space-y-4 pt-6 border-t border-zinc-800/50">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium text-zinc-400">Dynamic Inventory</h4>
                          <button
                            onClick={() => {
                              const newInv = [...(char.inventory || []), { item_name: "", description: "", narrative_status: "Equipped" }];
                              updateCharacter(id, { inventory: newInv });
                            }}
                            className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                          >
                            + Add Item
                          </button>
                        </div>
                        
                        {(char.inventory || []).length === 0 && (
                          <div className="text-xs text-zinc-600 italic">No inventory items.</div>
                        )}
                        {(char.inventory || []).map((item, idx) => (
                          <div key={idx} className="bg-black/30 border border-zinc-800/50 rounded-lg p-3 space-y-3 relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  const newInv = [...char.inventory];
                                  newInv.splice(idx, 1);
                                  updateCharacter(id, { inventory: newInv });
                                }}
                                className="text-rose-500 hover:text-rose-400 text-lg leading-none"
                                title="Remove Item"
                              >
                                &times;
                              </button>
                            </div>
                            <div className="flex space-x-3 pr-6">
                              <input
                                type="text"
                                placeholder="Item Name"
                                value={item.item_name}
                                onChange={(e) => {
                                  const newInv = [...char.inventory];
                                  newInv[idx].item_name = e.target.value;
                                  updateCharacter(id, { inventory: newInv });
                                }}
                                className="flex-1 bg-transparent border-b border-zinc-700 focus:border-indigo-500 outline-none text-sm text-zinc-200 pb-1"
                              />
                              <select
                                value={item.narrative_status}
                                onChange={(e) => {
                                  const newInv = [...char.inventory];
                                  newInv[idx].narrative_status = e.target.value;
                                  updateCharacter(id, { inventory: newInv });
                                }}
                                className="w-28 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:border-indigo-500 outline-none cursor-pointer"
                              >
                                <option value="Equipped">Equipped</option>
                                <option value="Stashed">Stashed</option>
                                <option value="Lost">Lost</option>
                              </select>
                            </div>
                            <textarea
                              placeholder="Brief description or narrative significance"
                              value={item.description}
                              onChange={(e) => {
                                const newInv = [...char.inventory];
                                newInv[idx].description = e.target.value;
                                updateCharacter(id, { inventory: newInv });
                              }}
                              className="w-full bg-transparent border-b border-zinc-700 focus:border-indigo-500 outline-none text-xs text-zinc-400 pb-1 resize-none overflow-hidden"
                              rows={1}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </article>
              ))
            )}

            {/* v8.1 Symbiotic Links & Proxy NPCs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-800/50">
              
              {/* Symbiotic Links */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-white border-l-4 border-rose-500 pl-4">Symbiotic Links</h3>
                <p className="text-sm text-zinc-500 mb-4">Locked tactical pairings with mathematically zero relational friction.</p>
                {actors.symbiotic_links && actors.symbiotic_links.length > 0 ? (
                  <div className="space-y-3">
                    {actors.symbiotic_links.map((link, idx) => (
                      <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-zinc-300 font-mono text-sm">
                          <span className="text-rose-400">{link[0]}</span>
                          <span className="text-zinc-600">↔</span>
                          <span className="text-rose-400">{link[1]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-xl p-6 text-center">
                    <p className="text-xs text-zinc-600">No active symbiotic links.</p>
                  </div>
                )}
              </div>

              {/* Proxy NPCs */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-white border-l-4 border-zinc-500 pl-4">Proxy NPCs</h3>
                <p className="text-sm text-zinc-500 mb-4">Lightweight, flattened actors optimized for token efficiency.</p>
                {Object.entries(actors.proxy_npcs || {}).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(actors.proxy_npcs).map(([id, npc]) => (
                      <div key={id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="font-bold text-white block">{npc.the_shield}</span>
                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full inline-block">{npc.faction_loyalty}</span>
                          </div>
                          <button
                            onClick={() => deleteCharacter(id)}
                            className="text-red-500 hover:text-red-400 p-1 transition-colors"
                            title="Delete NPC"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-3">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold block mb-1">Current Objective</label>
                          <input
                            type="text"
                            value={npc.current_objective}
                            onChange={(e) => updateCharacter(id, { current_objective: e.target.value })}
                            className="w-full bg-black/40 border-b border-zinc-700 focus:border-zinc-500 text-zinc-300 px-2 py-1 text-sm outline-none transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-xl p-6 text-center">
                    <p className="text-xs text-zinc-600">No proxy NPCs in the registry.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* ===================================== */}
        {/* LEVEL 4: THE VECTOR ENGINE            */}
        {/* ===================================== */}
        <div className="space-y-12 pb-12">
          <header className="space-y-2 pt-12 border-t border-zinc-800/50">
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                Level 4
              </span>{" "}
              <span className="opacity-80">| The Vector Engine</span>
            </h2>
            <p className="text-zinc-500 text-lg">
              Execution logic, pacing mechanics, and generation output.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Level 4.2 Unreliable Narrator Mode */}
            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8">
              <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-4">
                Level 4.2: Narrative Perspective
              </h3>
              
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium text-zinc-400">Narrative Perspective (POV)</label>
                <select
                  value={engine.pov_anchor || "Omniscient Objective"}
                  onChange={(e) => updateEngine({ pov_anchor: e.target.value })}
                  className="w-full bg-black/40 border border-zinc-700 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer"
                >
                  <option value="Omniscient Objective">Omniscient Objective</option>
                  {Object.values(actors.pov_characters || {}).map(actor => (
                    <option key={actor.character_id} value={actor.the_shield}>
                      {actor.the_shield}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-400">Perspective Variance (Unreliable Narrator)</label>
                  <span className="text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-md text-xs">
                    {engine.narrative_perspective_variance.variance_level.toFixed ? engine.narrative_perspective_variance.variance_level.toFixed(1) : engine.narrative_perspective_variance.variance_level}
                  </span>
                </div>
                <input
                  type="range" min="0" max="10" step="0.1"
                  value={engine.narrative_perspective_variance.variance_level}
                  onChange={(e) => updateNarrator({ variance_level: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="space-y-4 border-t border-zinc-800/50 pt-6">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-400">Prose Economy Scalar</label>
                  <span className="text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-md text-xs">
                    {engine.prose_economy_scalar !== undefined ? engine.prose_economy_scalar : 5}
                  </span>
                </div>
                <input
                  type="range" min="0" max="10" step="1"
                  value={engine.prose_economy_scalar !== undefined ? engine.prose_economy_scalar : 5}
                  onChange={(e) => updateEngine({ prose_economy_scalar: parseInt(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Stark Reality</span>
                  <span>Purple Prose</span>
                </div>
              </div>

              {/* Chekhov Vault Ledger (Interactive Table) */}
              <div className="pt-6 border-t border-zinc-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-400">Chekhov Vault Ledger</h4>
                  <button
                    onClick={addVaultItem}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    <span>Add Item</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {engine.chekhov_vault_ledger && engine.chekhov_vault_ledger.length === 0 ? (
                    <div className="bg-black/40 border border-zinc-700/80 rounded-xl p-8 text-center">
                      <p className="text-sm text-zinc-600 italic">Vault is empty.</p>
                    </div>
                  ) : (
                    engine.chekhov_vault_ledger && engine.chekhov_vault_ledger.map((item) => (
                      <div key={item.id} className="bg-black/40 border border-zinc-700/80 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center relative group">
                        
                        {/* Description Input */}
                        <div className="flex-1 w-full">
                          <textarea
                            value={item.description || item.details || (Object.values(item).find(v => typeof v === 'string' && v !== item.id)) || ""}
                            onChange={(e) => updateVaultItem(item.id, { description: e.target.value })}
                            placeholder="Plot device description..."
                            className="w-full bg-transparent border-b border-zinc-700/50 focus:border-amber-500/50 text-sm text-zinc-200 p-1 focus:outline-none transition-colors resize-none overflow-hidden"
                            rows={1}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                          />
                          <div className="flex items-center space-x-3 mt-2">
                            <select
                              value={item.causal_status || "Unresolved"}
                              onChange={(e) => updateVaultItem(item.id, { causal_status: e.target.value })}
                              className="bg-black/50 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500/50"
                            >
                              <option value="Unresolved">Unresolved</option>
                              <option value="Teased">Teased</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                            
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-zinc-500">Reveal Ep:</span>
                              <input
                                type="number"
                                value={item.resolution_episode !== undefined ? item.resolution_episode : -1}
                                onChange={(e) => updateVaultItem(item.id, { resolution_episode: parseInt(e.target.value) })}
                                className="w-16 bg-black/50 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500/50"
                                min="-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Controls Container */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                          {/* Force Payoff Toggle */}
                          <button
                            onClick={() => updateVaultItem(item.id, { force_payoff: !item.force_payoff })}
                            className={`flex items-center space-x-1 text-xs px-2 py-1.5 rounded-md transition-all ${item.force_payoff ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700 hover:text-zinc-300'}`}
                            title="Force engine to resolve this item in the next generation."
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            <span>Force Payoff</span>
                          </button>

                          {/* Lock Toggle */}
                          <button
                            onClick={() => updateVaultItem(item.id, { locked: !item.locked })}
                            className={`p-1.5 rounded-md transition-all ${item.locked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700 hover:text-zinc-300'}`}
                            title="Lock this item so the engine cannot resolve it."
                          >
                            {item.locked ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteVaultItem(item.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Execution / Compilation Area */}
            <section className="bg-gradient-to-br from-orange-950/20 to-amber-900/10 border border-orange-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-orange-900/10 flex flex-col space-y-6">
              {stateChangeReport && (
                <div className="bg-orange-900/40 border border-orange-500/50 rounded-2xl p-5 mb-4 shadow-inner">
                  <h4 className="text-orange-400 font-bold mb-3 uppercase tracking-wide text-xs">Director's Review: State Change Report</h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li><strong className="text-orange-300">Novelty Check:</strong> {stateChangeReport.novelty_check}</li>
                    <li><strong className="text-orange-300">Agency Preserved:</strong> {stateChangeReport.character_agency}</li>
                    <li><strong className="text-orange-300">Resolution Earned:</strong> {stateChangeReport.resolution_earned}</li>
                    <li><strong className="text-orange-300">Visual Evidence:</strong> {stateChangeReport.visual_evidence}</li>
                    <li><strong className="text-orange-300">Lexicon Mandate:</strong> {stateChangeReport.lexicon_mandate}</li>
                    <li><strong className="text-orange-300">Secondary Agency:</strong> {stateChangeReport.secondary_character_agency}</li>
                    <li><strong className="text-orange-300">Kinetic Struggle:</strong> {stateChangeReport.kinetic_struggle_check}</li>
                  </ul>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePrepareNextSequence}
                  disabled={isPreparing}
                  className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform shadow-lg flex items-center justify-center space-x-3 ${
                    isPreparing
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:-translate-y-1 hover:shadow-blue-500/30 active:translate-y-0"
                  }`}
                >
                  {isPreparing ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Preparing State...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{saga.is_epilogue_phase ? "Prepare Epilogue State" : "Prepare Next Sequence"}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCompileEpisode}
                  disabled={isCompiling}
                  className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform shadow-lg flex items-center justify-center space-x-3 ${
                    isCompiling
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white hover:-translate-y-1 hover:shadow-orange-500/30 active:translate-y-0"
                  }`}
                >
                  {isCompiling ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Compiling...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Compile Episode</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAdvanceTimeline}
                  disabled={!generatedText || isCompiling || isUpdatingSynopsis}
                  className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform shadow-lg flex items-center justify-center space-x-3 ${
                    !generatedText || isCompiling || isUpdatingSynopsis
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:-translate-y-1 hover:shadow-emerald-500/30 active:translate-y-0"
                  }`}
                >
                  {isUpdatingSynopsis ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing Synopsis...</span>
                    </>
                  ) : (
                    <>
                      <span>⏭️</span>
                      <span>Commit & Advance to Next Episode</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 flex flex-col space-y-2">
                <label className="text-sm font-medium text-orange-200/70">Generated Engine Output</label>
                <textarea
                  readOnly
                  value={generatedText}
                  placeholder="Engine output will stream here after compilation..."
                  className="flex-1 w-full min-h-[250px] bg-black/60 border border-orange-500/30 text-zinc-100 rounded-xl p-5 focus:outline-none focus:border-orange-500/80 transition-all duration-300 resize-none font-mono text-sm leading-relaxed"
                />
              </div>
            </section>
          </div>

          {/* Level 4.5 Executive Digest */}
          <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-6 shadow-2xl">
            <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-4 flex items-center space-x-3">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Level 4.5</span>
              <span>| Executive Digest (Synopsis)</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-300/70">Immediate Episode Synopsis</label>
                <textarea
                  readOnly
                  value={saga.immediate_synopsis || ""}
                  placeholder={isUpdatingSynopsis ? "Generating immediate synopsis..." : "The immediate synopsis of the current episode will automatically generate here..."}
                  className="w-full min-h-[100px] bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-xl p-5 focus:outline-none focus:border-indigo-500/50 transition-all duration-300 resize-y text-sm leading-relaxed font-serif"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-300/70">Cumulative Saga Synopsis</label>
                <textarea
                  readOnly
                  value={saga.cumulative_synopsis || ""}
                  placeholder={isUpdatingSynopsis ? "Updating cumulative synopsis..." : "The cumulative saga synopsis will dynamically build here seamlessly as you generate episodes..."}
                  className="w-full min-h-[150px] bg-black/40 border border-zinc-700/50 text-zinc-300 rounded-xl p-5 focus:outline-none focus:border-purple-500/50 transition-all duration-300 resize-y text-sm leading-relaxed font-serif"
                />
              </div>
            </div>
          </section>

          {/* Level 4.7: Director's Notes & Grader */}
          {directorsNotes && (
            <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl space-y-8 shadow-2xl">
              <header className="space-y-2 border-b border-zinc-800 pb-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Level 4.7</span>
                  <h3 className="text-xl font-medium text-white">| Director's Notes</h3>
                </div>
                <button 
                  onClick={() => setRewriteSliders(directorsNotes.recommended_slider_adjustments)}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 font-mono focus:outline-none"
                >
                  Snap to Recommendation
                </button>
              </header>

              <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                {/* Left side: Interactive Radar Chart */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">Interactive Evaluation Map</span>
                  
                  <svg 
                    width="300" 
                    height="300" 
                    className="select-none touch-none"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {/* Concentric grid circles */}
                    {[18, 36, 54, 72, 90].map((r, i) => (
                      <circle 
                        key={i} 
                        cx="150" 
                        cy="150" 
                        r={r} 
                        fill="none" 
                        stroke="#27272a" 
                        strokeWidth="1" 
                        strokeDasharray="4,4" 
                      />
                    ))}
                    
                    {/* Radial axis lines */}
                    {keys.map((_, i) => {
                      const pt = getRadarPoint(i, 10);
                      return (
                        <line 
                          key={i} 
                          x1="150" 
                          y1="150" 
                          x2={pt.x} 
                          y2={pt.y} 
                          stroke="#27272a" 
                          strokeWidth="1" 
                        />
                      );
                    })}
                    
                    {/* Axis Labels */}
                    {labels.map((lbl, i) => {
                      const pt = getRadarPoint(i, 11.5);
                      let anchor = "middle";
                      if (i === 1 || i === 2) anchor = "start";
                      if (i === 3 || i === 4) anchor = "end";
                      
                      return (
                        <text
                          key={i}
                          x={pt.x}
                          y={pt.y + 4}
                          fill="#a1a1aa"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="semibold"
                          textAnchor={anchor}
                        >
                          {lbl}
                        </text>
                      );
                    })}
                    
                    {/* Score polygon */}
                    <polygon 
                      points={keys.map((key, i) => {
                        const val = rewriteSliders[key] || 0;
                        const pt = getRadarPoint(i, val);
                        return `${pt.x},${pt.y}`;
                      }).join(" ")}
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="#2563eb"
                      strokeWidth="2"
                    />
                    
                    {/* Interaction drag handles */}
                    {keys.map((key, i) => {
                      const val = rewriteSliders[key] || 0;
                      const pt = getRadarPoint(i, val);
                      return (
                        <circle
                          key={key}
                          cx={pt.x}
                          cy={pt.y}
                          r="6"
                          fill="#3b82f6"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-grab active:cursor-grabbing"
                          onPointerDown={handlePointerDown(i)}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Right side: Critique & Sliders */}
                <div className="flex-1 w-full space-y-6">
                  {/* Critique Card */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider block">Director's Critique</span>
                    <p className="text-zinc-200 text-sm leading-relaxed italic font-serif">
                      "{directorsNotes.critique}"
                    </p>
                  </div>

                  {/* Original Evaluation Scores */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block border-b border-zinc-800 pb-2">Original Evaluation</span>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { name: "Pacing", val: directorsNotes.pacing_density, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                        { name: "Realism", val: directorsNotes.character_realism, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
                        { name: "Logic", val: directorsNotes.causal_logic, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                        { name: "Thematic", val: directorsNotes.thematic_resonance, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                        { name: "Captivation", val: directorsNotes.captivation, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" }
                      ].map(m => (
                        <div key={m.name} className={`${m.color} rounded-xl p-2 flex flex-col items-center justify-center border text-center`}>
                          <span className="text-[9px] uppercase font-semibold text-zinc-500 tracking-wider truncate w-full">{m.name}</span>
                          <span className="text-base font-bold mt-1">{m.val}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tuning Sliders */}
                  <div className="space-y-6">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block border-b border-zinc-800 pb-2">Tuning Coordinates</span>
                    
                    {/* Grid for the first 4 sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {[
                        { key: "pacing_density", label: "Pacing Density" },
                        { key: "character_realism", label: "Character Realism" },
                        { key: "causal_logic", label: "Causal Logic" },
                        { key: "thematic_resonance", label: "Thematic Resonance" }
                      ].map(slider => (
                        <div key={slider.key} className="flex items-center justify-between gap-4">
                          <label className="text-xs text-zinc-400 font-semibold w-32 truncate">{slider.label}</label>
                          <div className="flex-1 flex items-center space-x-3">
                            <input 
                              type="range"
                              min="0"
                              max="10"
                              step="0.1"
                              value={rewriteSliders[slider.key] || 0}
                              onChange={(e) => setRewriteSliders({
                                ...rewriteSliders,
                                [slider.key]: parseFloat(e.target.value)
                              })}
                              className="custom-slider flex-1"
                            />
                            <span className="w-10 text-center text-xs font-mono bg-zinc-900 border border-zinc-800/80 text-zinc-300 py-1.5 rounded-lg flex items-center justify-center">
                              {Math.round(rewriteSliders[slider.key] || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Captivation */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-900">
                      <label className="text-xs text-zinc-400 font-semibold w-32 truncate">Captivation</label>
                      <div className="flex-1 flex items-center space-x-3">
                        <input 
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={rewriteSliders.captivation || 0}
                          onChange={(e) => setRewriteSliders({
                            ...rewriteSliders,
                            captivation: parseFloat(e.target.value)
                          })}
                          className="custom-slider flex-1"
                        />
                        <span className="w-10 text-center text-xs font-mono bg-zinc-900 border border-zinc-800/80 text-zinc-300 py-1.5 rounded-lg flex items-center justify-center">
                          {Math.round(rewriteSliders.captivation || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Notes Section */}
                  <div className="space-y-3 pt-4 border-t border-zinc-800 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-400">Custom Director's Notes</label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={useDirectorCritique}
                          onChange={(e) => setUseDirectorCritique(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-violet-500 rounded border-zinc-700 bg-zinc-900"
                        />
                        <span className="text-xs text-zinc-500">Include AI Critique</span>
                      </label>
                    </div>
                    <textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Write explicit instructions for the next sequence or rewrite..."
                      className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none"
                    />
                  </div>

                  {/* Prepare Rewrite Button */}
                  <div className="pt-2">
                    <button
                      onClick={handlePrepareRewrite}
                      disabled={isPreparing}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg ${
                        isPreparing 
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none" 
                          : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white hover:-translate-y-0.5 hover:shadow-violet-500/25 active:translate-y-0"
                      }`}
                    >
                      {isPreparing ? (
                        <>
                          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Preparing State...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Prepare Rewrite State</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ===================================== */}
        {/* LEVEL 5: NARRATIVE ECHO MATRIX        */}
        {/* ===================================== */}
        <div className={`space-y-8 transition-all duration-1000 ${
          (["organic_convergence", "Organic Convergence"].includes(kernel.progression_termination_mode) && !saga.is_final_episode) || 
          (kernel.progression_termination_mode === "fixed_grids" && saga.current_saga_index < kernel.target_episode_count - 1)
            ? "opacity-40 grayscale pointer-events-none" 
            : "opacity-100"
        }`}>
          <header className="space-y-2 border-b border-zinc-800 pb-4">
            <h2 className="text-3xl font-light text-white tracking-tight">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-stone-400 to-zinc-400">
                Level 5
              </span>{" "}
              <span className="opacity-80">| Narrative Echo Matrix</span>
            </h2>
            <p className="text-zinc-500 text-sm">
              Terminal epilogue state and legacy resolution parameters.
            </p>
          </header>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden space-y-12">
            
            {/* Synthesis Validator */}
            <section className="space-y-6">
              <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-2">Synthesis Validator</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-400">Internal Need Met</label>
                  <button
                    onClick={() => updateSynthesis({ internal_need_met: !matrix.synthesis_validator.internal_need_met })}
                    className={`w-full py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 border ${
                      matrix.synthesis_validator.internal_need_met 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]' 
                        : 'bg-black/40 border-zinc-700/50 text-zinc-500 hover:border-zinc-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 ${matrix.synthesis_validator.internal_need_met ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-600 bg-transparent'}`}></div>
                    <span>{matrix.synthesis_validator.internal_need_met ? 'Achieved' : 'Pending'}</span>
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-400">External Want Achieved</label>
                  <button
                    onClick={() => updateSynthesis({ external_want_achieved: !matrix.synthesis_validator.external_want_achieved })}
                    className={`w-full py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 border ${
                      matrix.synthesis_validator.external_want_achieved 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'bg-black/40 border-zinc-700/50 text-zinc-500 hover:border-zinc-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 ${matrix.synthesis_validator.external_want_achieved ? 'border-blue-400 bg-blue-400' : 'border-zinc-600 bg-transparent'}`}></div>
                    <span>{matrix.synthesis_validator.external_want_achieved ? 'Achieved' : 'Pending'}</span>
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-400">Structural Resolution Frame</label>
                  <select
                    value={matrix.synthesis_validator.structural_resolution_frame}
                    onChange={(e) => updateSynthesis({ structural_resolution_frame: e.target.value })}
                    className="w-full h-14 bg-black/40 border border-zinc-700/80 text-zinc-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-stone-500/50 transition-all cursor-pointer"
                  >
                    <option value="synthesis">Synthesis</option>
                    <option value="tragedy">Tragedy</option>
                    <option value="irony">Irony</option>
                    <option value="hollow_victory">Hollow Victory</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Thematic Stamp */}
            <section className="space-y-4">
              <h3 className="text-xl font-medium text-white border-b border-zinc-800 pb-2">Thematic Stamp</h3>
              <textarea
                readOnly
                value={matrix.epilogue_sub_modules.thematic_stamp_valve}
                className="w-full h-24 bg-stone-900/40 border border-stone-500/30 text-stone-300 rounded-xl p-4 focus:outline-none resize-none font-serif italic text-lg leading-relaxed shadow-inner shadow-black/50"
              />
            </section>

            {/* Legacy Ledgers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Geopolitical Scar Ledger */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-lg font-medium text-white">Geopolitical Scar Ledger</h3>
                  <button
                    onClick={() => {
                      const id = crypto.randomUUID();
                      updateEpilogue({
                        geopolitical_scar_ledger: [
                          ...matrix.epilogue_sub_modules.geopolitical_scar_ledger,
                          { id, description: '' }
                        ]
                      });
                    }}
                    className="text-xs font-semibold text-stone-400 bg-stone-500/10 hover:bg-stone-500/20 px-3 py-1.5 rounded-lg border border-stone-500/20 transition-all"
                  >
                    + Add Scar
                  </button>
                </div>
                <div className="space-y-2">
                  {matrix.epilogue_sub_modules.geopolitical_scar_ledger.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-sm">
                      No permanent scars recorded yet.
                    </div>
                  ) : (
                    matrix.epilogue_sub_modules.geopolitical_scar_ledger.map((scar) => (
                      <div key={scar.id} className="flex items-center space-x-2 bg-black/40 border border-zinc-800 p-2 rounded-xl">
                        <input
                          type="text"
                          value={scar.description}
                          onChange={(e) => {
                            updateEpilogue({
                              geopolitical_scar_ledger: matrix.epilogue_sub_modules.geopolitical_scar_ledger.map(s => 
                                s.id === scar.id ? { ...s, description: e.target.value } : s
                              )
                            });
                          }}
                          placeholder="e.g. The capital city remains in ruins..."
                          className="flex-1 bg-transparent border-none text-sm text-zinc-300 focus:ring-0 p-2"
                        />
                        <button
                          onClick={() => {
                            updateEpilogue({
                              geopolitical_scar_ledger: matrix.epilogue_sub_modules.geopolitical_scar_ledger.filter(s => s.id !== scar.id)
                            });
                          }}
                          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Cast Web Dispersion */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-lg font-medium text-white">Cast Web Dispersion</h3>
                  <button
                    onClick={() => {
                      const id = crypto.randomUUID();
                      updateEpilogue({
                        cast_web_dispersion_table: [
                          ...matrix.epilogue_sub_modules.cast_web_dispersion_table,
                          { id, actor: '', final_location: '', narrative_status: '' }
                        ]
                      });
                    }}
                    className="text-xs font-semibold text-stone-400 bg-stone-500/10 hover:bg-stone-500/20 px-3 py-1.5 rounded-lg border border-stone-500/20 transition-all"
                  >
                    + Add Fate
                  </button>
                </div>
                <div className="space-y-2">
                  {matrix.epilogue_sub_modules.cast_web_dispersion_table.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-sm">
                      No character fates recorded yet.
                    </div>
                  ) : (
                    matrix.epilogue_sub_modules.cast_web_dispersion_table.map((fate) => (
                      <div key={fate.id} className="flex flex-col space-y-2 bg-black/40 border border-zinc-800 p-3 rounded-xl relative group">
                        <input
                          type="text"
                          value={fate.actor}
                          onChange={(e) => {
                            updateEpilogue({
                              cast_web_dispersion_table: matrix.epilogue_sub_modules.cast_web_dispersion_table.map(f => 
                                f.id === fate.id ? { ...f, actor: e.target.value } : f
                              )
                            });
                          }}
                          placeholder="Actor Name"
                          className="w-full bg-transparent border-b border-zinc-800 text-sm font-semibold text-white focus:border-stone-500 focus:ring-0 p-1"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={fate.final_location}
                            onChange={(e) => {
                              updateEpilogue({
                                cast_web_dispersion_table: matrix.epilogue_sub_modules.cast_web_dispersion_table.map(f => 
                                  f.id === fate.id ? { ...f, final_location: e.target.value } : f
                                )
                              });
                            }}
                            placeholder="Final Location"
                            className="w-1/2 bg-zinc-900/50 border border-zinc-800 rounded text-xs text-zinc-300 focus:border-stone-500 p-2"
                          />
                          <input
                            type="text"
                            value={fate.narrative_status}
                            onChange={(e) => {
                              updateEpilogue({
                                cast_web_dispersion_table: matrix.epilogue_sub_modules.cast_web_dispersion_table.map(f => 
                                  f.id === fate.id ? { ...f, narrative_status: e.target.value } : f
                                )
                              });
                            }}
                            placeholder="Status (e.g. Alive, Exiled)"
                            className="w-1/2 bg-zinc-900/50 border border-zinc-800 rounded text-xs text-zinc-300 focus:border-stone-500 p-2"
                          />
                        </div>
                        <button
                          onClick={() => {
                            updateEpilogue({
                              cast_web_dispersion_table: matrix.epilogue_sub_modules.cast_web_dispersion_table.filter(f => f.id !== fate.id)
                            });
                          }}
                          className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
