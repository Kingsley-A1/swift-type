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

// Expanded to check offline first, then (mock) API fallback or just generate extensive local dictionary
export const getRandomWords = (
  level: keyof typeof DICTIONARY = "beginner",
  count: number = 20,
) => {
  const words = DICTIONARY[level] || DICTIONARY.beginner;
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
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
