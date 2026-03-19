import { DICTIONARY } from "@/data/dictionary";

type KeyStats = {
  hits: number;
  misses: number;
  totalTimeMs: number;
};

type NGramStats = {
  occurrences: number;
  misses: number;
  totalTimeMs: number;
};

/**
 * AdaptiveEngine identifies the weakest typing areas (slow keys, error-prone keys, or bad bigrams)
 * and generates a custom text drill to strengthen those specific patterns.
 */
export function generateAdaptiveText(
  perKeyStats: Record<string, KeyStats>,
  nGramStats: Record<string, NGramStats> | undefined, // Passing n-grams
  baseLevel: keyof typeof DICTIONARY = "beginner",
  wordCount: number = 20,
) {
  const dictionary = DICTIONARY[baseLevel];

  if (Object.keys(perKeyStats).length === 0) {
    // No data yet, return standard random text
    return generateRandomText(dictionary, wordCount);
  }

  // 1. Calculate an N-gram struggle score (Bigrams)
  let weakestBigrams: string[] = [];
  if (nGramStats && Object.keys(nGramStats).length > 0) {
    const bigramScores = Object.entries(nGramStats).map(([bigram, stats]) => {
      if (stats.occurrences < 3) return { bigram, score: 0 };
      const errorRate = stats.misses / stats.occurrences;
      const avgTime = stats.totalTimeMs / stats.occurrences;
      const timePenalty = Math.min(avgTime / 600, 1) * 0.4;
      const errorPenalty = errorRate * 0.6;
      return { bigram, score: errorPenalty + timePenalty };
    });
    bigramScores.sort((a, b) => b.score - a.score);
    weakestBigrams = bigramScores.slice(0, 3).map((s) => s.bigram);
  }

  // 2. Calculate a "struggle score" for individual keys.
  const struggleScores = Object.entries(perKeyStats).map(([char, stats]) => {
    const totalAttempts = stats.hits + stats.misses;
    if (totalAttempts < 3) return { char, score: 0 };

    const errorRate = stats.misses / totalAttempts;
    const avgTime = stats.totalTimeMs / totalAttempts;

    const timePenalty = Math.min(avgTime / 500, 1) * 0.3;
    const errorPenalty = errorRate * 0.7;

    return {
      char,
      score: errorPenalty + timePenalty,
    };
  });

  struggleScores.sort((a, b) => b.score - a.score);
  const weakestChars = struggleScores.slice(0, 3).map((s) => s.char);

  if (weakestChars.length === 0 && weakestBigrams.length === 0) {
    return generateRandomText(dictionary, wordCount);
  }

  // 3. Filter dictionary to prioritize words containing weak bigrams and characters
  // Weight words by how many weak patterns they contain
  const ScoredWords = dictionary.map((word) => {
    let score = 0;
    weakestBigrams.forEach((bg) => {
      if (word.includes(bg)) score += 2;
    });
    weakestChars.forEach((char) => {
      if (word.includes(char)) score += 1;
    });
    return { word, score };
  });

  // Filter out zero scores if possible
  const validTargets = ScoredWords.filter((w) => w.score > 0).sort(
    (a, b) => b.score - a.score,
  );

  const pool =
    validTargets.length >= 10
      ? validTargets.map((w) => w.word)
      : [...validTargets.map((w) => w.word), ...dictionary].slice(
          0,
          Math.max(dictionary.length, 50),
        ); // Ensure we have enough words to sample

  return generateRandomText(pool, wordCount);
}

function generateRandomText(pool: string[], count: number) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return result.join(" ");
}

/**
 * Generates custom text for the specified Curriculum stage using only allowed keys.
 */
export function generateCurriculumText(stageId: number, count: number = 30) {
  const stage = CURRICULUM_STAGES.find((s) => s.id === stageId) || CURRICULUM_STAGES[0];
  const keys = stage.keys;
  
  const result = [];
  for (let i = 0; i < count; i++) {
    const wordLength = Math.floor(Math.random() * 4) + 2; // Words between 2 to 5 characters long
    let word = "";
    for (let j = 0; j < wordLength; j++) {
      word += keys[Math.floor(Math.random() * keys.length)];
    }
    result.push(word);
  }
  return result.join(" ");
}

/**
 * Curriculum Mode: Step-by-step introduction to the keyboard.
 */
export const CURRICULUM_STAGES = [
  {
    id: 1,
    name: "Home Row Focus",
    keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    text: "asdf jkl; asdf jkl; sad fad lad fall dash flash flask slash",
  },
  {
    id: 2,
    name: "Top Row Intro",
    keys: ["q", "w", "e", "r", "u", "i", "o", "p"],
    text: "qwer uiop rue ire our pie pour pure wire require require",
  },
  {
    id: 3,
    name: "Bottom Row Into",
    keys: ["z", "x", "c", "v", "m", ",", ".", "/"],
    text: "zxcv m,./ zoom mac vac cab van man pan map cap pack",
  },
];
