/**
 * Attempts to extract JSON from malformed responses (e.g. wrapped in markdown block)
 * and handles common issues like trailing commas or leading/trailing commentary text.
 */
export function extractAndParseJSON(text: string): unknown {
  if (!text) return null;

  let cleaned = text.trim();

  // Strip markdown code blocks
  // e.g., ```json ... ```
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = cleaned.match(markdownRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // Handle trailing commas in arrays/objects
  // Regex to remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn("[JSON_PARSER_WARN] Direct JSON parse failed, trying fallback regex extraction. Error details:", error);
    // If direct parse fails, try searching for any subset pattern that resembles a JSON object or array.
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const candidate = cleaned.substring(startIdx, endIdx + 1).replace(/,\s*([}\]])/g, "$1");
      try {
        return JSON.parse(candidate);
      } catch (nestedError) {
        console.error("[JSON_PARSER_ERROR] Failed substring parsing candidate:", nestedError);
      }
    }

    const startArrIdx = cleaned.indexOf("[");
    const endArrIdx = cleaned.lastIndexOf("]");
    if (startArrIdx !== -1 && endArrIdx !== -1 && endArrIdx > startArrIdx) {
      const candidate = cleaned.substring(startArrIdx, endArrIdx + 1).replace(/,\s*([}\]])/g, "$1");
      try {
        return JSON.parse(candidate);
      } catch (nestedError) {
        console.error("[JSON_PARSER_ERROR] Failed array parsing candidate:", nestedError);
      }
    }

    console.error("[JSON_PARSER_ERROR] Full parser failure on text snippet:", text.substring(0, 200));
    return null;
  }
}
