const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** "four": so the copy follows the size of the cast instead of hard-coding it. */
export function numberWord(n: number): string {
  return WORDS[n] ?? String(n);
}

export function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
