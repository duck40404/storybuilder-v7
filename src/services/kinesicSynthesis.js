// src/services/kinesicSynthesis.js

export function synthesizeDirectorialDirective(kinesic_profile) {
  // Safe defaults if missing
  const profile = kinesic_profile || {
    morality_empathy: 5,
    action_bias: 5,
    emotional_armor: 5,
    thematic_alignment: 5,
    verbal_density: 5
  };

  const directives = [];

  // 1. Morality / Empathy
  if (profile.morality_empathy <= 2) directives.push("Utterly ruthless and psychopathic, with no regard for collateral damage.");
  else if (profile.morality_empathy <= 4) directives.push("Self-serving with a callous edge.");
  else if (profile.morality_empathy <= 6) directives.push("Pragmatic but retains basic human decency.");
  else if (profile.morality_empathy <= 8) directives.push("Highly compassionate, motivated by altruism and protective instincts.");
  else directives.push("Martyr-level empathy, willing to sacrifice self before harming others.");

  // 2. Action Bias
  if (profile.action_bias <= 2) directives.push("Paralyzed by analysis or incredibly methodical; plans ten steps ahead.");
  else if (profile.action_bias <= 4) directives.push("Cautious; prefers defense and observation over direct conflict.");
  else if (profile.action_bias <= 6) directives.push("Balanced reactor; acts appropriately when necessary.");
  else if (profile.action_bias <= 8) directives.push("Highly kinetic and impulsive; strikes first and asks questions later.");
  else directives.push("Rabidly proactive; acts instantly on raw instinct without any forethought.");

  // 3. Emotional Armor
  if (profile.emotional_armor <= 2) directives.push("Openly vulnerable, volatile, and highly expressive; wears their heart on their sleeve.");
  else if (profile.emotional_armor <= 4) directives.push("Emotionally available but attempts to maintain composure.");
  else if (profile.emotional_armor <= 6) directives.push("Guarded, though their emotional wall cracks under severe pressure.");
  else if (profile.emotional_armor <= 8) directives.push("Highly stoic; represses emotion behind an impenetrable wall.");
  else directives.push("Completely detached and emotionally deadened.");

  // 4. Thematic Alignment
  if (profile.thematic_alignment <= 2) directives.push("Actively subverts the core theme; an agent of the narrative's antithesis.");
  else if (profile.thematic_alignment <= 4) directives.push("Resists the main thematic pull.");
  else if (profile.thematic_alignment <= 6) directives.push("Neutrally drifts through the thematic currents.");
  else if (profile.thematic_alignment <= 8) directives.push("Strongly embodies the core thesis of the narrative.");
  else directives.push("The absolute avatar and embodiment of the core theme.");

  // 5. Verbal Density
  if (profile.verbal_density === 0) {
    directives.push("Taciturn; prefers total silence and speaks only when strictly necessary.");
  } else if (profile.verbal_density <= 3) {
    directives.push("Speaks in sparse, terse syllables.");
  } else if (profile.verbal_density <= 6) {
    directives.push("Conversational but purposeful; does not waste words.");
  } else if (profile.verbal_density <= 8) {
    directives.push("Highly articulate and talkative; processes thoughts aloud.");
  } else {
    directives.push("Highly Verbose; dominates conversations by sheer volume, whether nervous rambling or over-explaining.");
  }

  return `DIRECTIVE: ${directives.join(" ")}`;
}
