const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what", "so",
  "up", "out", "if", "about", "who", "get", "which", "go", "me", "when",
  "make", "can", "like", "time", "no", "just", "him", "know", "take", "people",
  "into", "year", "your", "good", "some", "could", "them", "see", "other", "than",
  "then", "now", "look", "only", "come", "its", "over", "think", "also", "back",
  "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "great", "between", "need", "large", "often", "hand", "high", "place", "hold",
  "turn", "were", "asked", "men", "read", "land", "different", "home", "move",
  "try", "kind", "play", "air", "away", "animal", "house", "point", "page",
  "letter", "mother", "answer", "found", "study", "still", "learn", "plant",
  "food", "sun", "four", "state", "keep", "eye", "never", "last", "let",
  "thought", "city", "tree", "cross", "farm", "hard", "start", "might", "story",
  "saw", "far", "sea", "draw", "left", "late", "run", "while", "press",
  "close", "night", "real", "life", "few", "north", "open", "seem", "together",
  "next", "white", "children", "begin", "walk", "example", "paper", "group",
  "always", "music", "those", "both", "mark", "book", "carry", "science",
  "eat", "room", "friend", "began", "idea", "fish", "mountain", "stop", "once",
  "base", "hear", "horse", "cut", "sure", "watch", "color", "face", "wood",
  "main", "enough", "plain", "girl", "usual", "young", "ready", "above", "ever",
  "red", "list", "though", "feel", "talk", "bird", "soon", "body", "dog",
  "family", "direct", "leave", "song", "measure", "door", "product", "black",
  "short", "class", "wind", "question", "happen", "complete", "ship", "area",
  "half", "rock", "order", "fire", "south", "problem", "piece", "told", "knew",
  "pass", "since", "top", "whole", "king", "space", "heard", "best", "hour",
  "better", "true", "during", "hundred", "five", "remember", "step", "early",
  "ground", "interest", "reach", "fast", "sing", "listen", "six", "table",
  "travel", "less", "morning", "ten", "simple", "several", "toward", "war",
  "lay", "against", "pattern", "slow", "center", "love", "person", "money",
  "serve", "appear", "road", "map", "rain", "rule", "pull", "cold", "notice",
  "voice", "unit", "power", "town", "fine", "certain", "fly", "fall", "lead",
  "cry", "dark", "machine", "note", "wait", "plan", "figure", "star", "box",
  "field", "rest", "able", "done", "beauty", "drive", "stood", "front", "teach",
  "week", "final", "gave", "green", "quick", "develop", "ocean", "warm", "free",
  "minute", "strong", "special", "behind", "clear", "strong", "light", "deep",
  "small", "long", "word", "number", "part", "every", "found", "still", "name",
  "should", "where", "much", "through", "before", "right", "too", "same", "tell",
  "does", "set", "three", "must", "own", "another", "came", "such", "think",
  "here", "took", "old", "show", "again", "many", "help", "went", "need", "each",
  "very", "next", "important", "move", "kind", "play", "hand", "picture", "change",
  "off", "spell", "story", "follow", "want", "show", "also", "around", "form",
  "small", "set", "put", "end", "does", "large", "big", "turn", "need", "hard",
  "open", "seem", "together", "got", "example", "always", "both", "paper",
  "together", "kept", "light", "voice", "power", "town", "done", "known",
];

const PUNCTUATION = [",", ".", "!", "?", ";", ":"];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateWords(
  count: number,
  usePunctuation: boolean,
  useNumbers: boolean
): string[] {
  const pool = shuffle(COMMON_WORDS);
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const word = pool[i % pool.length];

    if (useNumbers && Math.random() < 0.12) {
      result.push(String(Math.floor(Math.random() * 999) + 1));
    } else if (usePunctuation && Math.random() < 0.22) {
      const punct = PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
      result.push(word + punct);
    } else {
      result.push(word);
    }
  }

  return result;
}
