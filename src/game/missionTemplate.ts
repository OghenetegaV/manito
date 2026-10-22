/**
 * The Manito-photo brief is the same for everyone, written with a `{{manito}}` token in place
 * of the actual name — filled in here at render time, once the player's own Manito is known,
 * so the stored brief never has to be duplicated per person.
 */
export function fillTemplate(text: string, manitoName: string): string {
  return text.replaceAll("{{manito}}", manitoName);
}
