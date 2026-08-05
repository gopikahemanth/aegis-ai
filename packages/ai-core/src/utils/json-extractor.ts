export class JsonExtractor {
  extract(text: string): string {
    // Strip markdown code fences if present
    const cleanedText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const objectFirst = cleanedText.indexOf("{");
    const objectLast = cleanedText.lastIndexOf("}");
    const arrayFirst = cleanedText.indexOf("[");
    const arrayLast = cleanedText.lastIndexOf("]");

    const hasObject = objectFirst !== -1 && objectLast !== -1 && objectLast > objectFirst;
    const hasArray = arrayFirst !== -1 && arrayLast !== -1 && arrayLast > arrayFirst;

    if (hasObject && (!hasArray || objectFirst < arrayFirst)) {
      return cleanedText.slice(objectFirst, objectLast + 1);
    }

    if (hasArray) {
      return cleanedText.slice(arrayFirst, arrayLast + 1);
    }

    throw new Error("No JSON object or array found in AI response.");
  }
}
