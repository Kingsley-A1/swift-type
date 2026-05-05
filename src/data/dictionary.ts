export const DICTIONARY = {
  beginner: [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", 
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", 
    "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", 
    "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", 
    "now", "look", "only", "come", "its", "over", "think", "also", "type", "quick", "brown", "fox", "jumps", "dog", "fast", "home", 
    "keys", "row", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", 
    "any", "these", "give", "day", "most", "us", "is", "was", "are", "has", "had", "been", "were", "much", "down", "man", "many", 
    "life", "long", "same", "child", "more", "call", "may", "still", "try", "need", "feel", "part", "word", "place", "little", "since", 
    "around", "find", "show", "old", "late", "help", "let", "end", "world", "while", "off", "does", "fact", "play", "few", "both"
  ],
  intermediate: [
    "technology", "development", "software", "engineering", "programmer", "interface", "application", "database", "function", 
    "variable", "algorithm", "compile", "execute", "system", "network", "account", "beautiful", "certain", "design", "everything", 
    "familiar", "general", "however", "important", "knowledge", "language", "material", "necessary", "original", "particular", 
    "question", "remember", "sentence", "together", "understand", "various", "wonderful", "yesterday", "direction", "difference", 
    "character", "business", "available", "attention", "although", "community", "condition", "education", "experience", "financial", 
    "government", "information", "organization", "performance", "population", "project", "product", "program", "problem", "process", 
    "possible", "personal", "position", "actually", "probably", "building", "action", "another", "against", "without", "company", 
    "nothing", "someone", "something", "everyone", "anything", "everything", "sometimes", "children", "computer", "internet", 
    "website", "solution", "strategy", "analysis", "approach", "argument", "authority", "behavior", "campaign", "candidate", 
    "capacity", "category", "challenge", "collection", "commercial", "committee", "condition", "conference", "connection", 
    "consumer", "container", "contract", "customer", "daughter", "decision", "delivery", "democracy", "department", "description", 
    "difference", "difficulty", "director", "discovery", "discussion", "disease", "document", "economic", "election", "employee", 
    "environment", "equipment", "especially", "establish", "evaluation", "evidence", "executive", "existence", "expectation", 
    "experience", "experiment", "explanation", "expression", "generation", "hospital", "important", "impossible", "improvement"
  ],
  advanced: [
    "asynchronous", "polymorphism", "encapsulation", "inheritance", "abstraction", "concurrency", "parallelism", "optimization", 
    "scalability", "architecture", "infrastructure", "deployment", "repository", "versioning", "continuous", "administrative", 
    "characteristic", "comprehensive", "consideration", "demonstration", "determination", "environmental", "establishment", 
    "extraordinary", "international", "investigation", "manufacturing", "participation", "philosophical", "psychological", 
    "recommendation", "responsibility", "revolutionary", "significantly", "technological", "understanding", "unfortunately", 
    "counterproductive", "decriminalization", "disenfranchised", "excommunication", "incomprehensible", "indistinguishable", 
    "misinterpretation", "overcapitalized", "telecommunications", "uncompromisingly", "unconstitutional", "unprecedented", 
    "unsophisticated", "acknowledgement", "authoritarianism", "biodegradability", "capitalization", "circumstantial", "commercialization", 
    "comprehendible", "configuration", "constitutional", "contextualization", "conventionalize", "demilitarization", "disproportionate", 
    "diversification", "electromagnetism", "entrepreneurship", "epistemological", "existentialism", "experimentalism", "extraterrestrial", 
    "heterogeneous", "homogenization", "hydroelectricity", "hypothetical", "idiosyncrasy", "implementation", "improvisation", 
    "inconsequential", "indescribable", "industrialization", "insurmountable", "interchangeable", "intercontinental", "interdisciplinary", 
    "internationalization", "interrogative", "introspective", "irreconcilable", "irrefutability", "lexicographical", "macromolecule", 
    "mathematical", "metamorphosis", "methodological", "microprocessor", "multidimensional", "multidisciplinary", "neurotransmitter", 
    "nonproliferation", "omnipresence", "orchestration", "paleontologist", "parameterization", "personification", "phenomenological", 
    "photosynthesis", "predetermination", "premeditation", "procrastination", "proprietorship", "psychoanalysis", "quantification", 
    "rationalization", "rehabilitation", "representational", "standardization", "subterranean", "superficiality", "sustainability", 
    "symmetrical", "synchronization", "systematization", "thermodynamics", "transformational", "transistorized", "translucent", 
    "unpredictability", "unquestionable", "unrecognizable", "unsubstantiated", "vascularization", "vulnerability", "weatherization"
  ]
};

const LEVEL_DISTRIBUTIONS = {
  beginner: { beginner: 1.0, intermediate: 0.0, advanced: 0.0 },
  intermediate: { beginner: 0.6, intermediate: 0.4, advanced: 0.0 },
  advanced: { beginner: 0.5, intermediate: 0.3, advanced: 0.2 },
};

const PUNCTUATION_CHANCES = {
  beginner: { capitalize: 0, period: 0, comma: 0 },
  intermediate: { capitalize: 0.1, period: 0.05, comma: 0.05 },
  advanced: { capitalize: 0.2, period: 0.1, comma: 0.1 },
};

export const getRandomWords = (
  level: keyof typeof DICTIONARY = "beginner",
  count: number = 20,
) => {
  const dist = LEVEL_DISTRIBUTIONS[level] || LEVEL_DISTRIBUTIONS.beginner;
  const punc = PUNCTUATION_CHANCES[level] || PUNCTUATION_CHANCES.beginner;
  const result: string[] = [];
  let lastWord = "";
  let capitalizeNext = true; // Always start sentence capitalized for int/adv

  for (let i = 0; i < count; i++) {
    // 1. Distribution weight selection
    const rand = Math.random();
    let selectedLevel: keyof typeof DICTIONARY = "beginner";
    if (rand > dist.beginner + dist.intermediate) {
      selectedLevel = "advanced";
    } else if (rand > dist.beginner) {
      selectedLevel = "intermediate";
    }

    const wordsPool = DICTIONARY[selectedLevel];

    // 2. Prevent consecutive duplicates
    let word = "";
    do {
      word = wordsPool[Math.floor(Math.random() * wordsPool.length)];
    } while (word === lastWord && wordsPool.length > 1);
    
    lastWord = word;

    // 3. Dynamic Capitalization and Punctuation
    let formattedWord = word;

    // Capitalize
    if (capitalizeNext || Math.random() < punc.capitalize) {
      formattedWord = formattedWord.charAt(0).toUpperCase() + formattedWord.slice(1);
      capitalizeNext = false;
    }

    // Punctuation (don't add to the very last word)
    if (i < count - 1) {
      const pRand = Math.random();
      if (pRand < punc.period) {
        formattedWord += ".";
        capitalizeNext = true;
      } else if (pRand < punc.period + punc.comma) {
        formattedWord += ",";
      }
    } else if (level !== "beginner") {
      // End intermediate/advanced with a period
      formattedWord += ".";
    }

    result.push(formattedWord);
  }

  return result.join(" ");
};

// Potential future feature: fetch from external high-frequency English API
export const fetchApiWords = async (count: number = 20): Promise<string> => {
  try {
    const res = await fetch(
      `https://random-word-api.herokuapp.com/word?number=${count}`,
    );
    const words: string[] = await res.json();
    return words.join(" ");
  } catch (e) {
    console.warn("API word fetch failed, falling back to local dictionary", e);
    return getRandomWords("intermediate", count);
  }
};
