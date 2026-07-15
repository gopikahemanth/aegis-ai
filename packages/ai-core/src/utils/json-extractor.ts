export class JsonExtractor {
  extract(text: string): string {
    const first =
      text.indexOf("[");

    const last =
      text.lastIndexOf("]");

    if (
      first === -1 ||
      last === -1
    ) {
      throw new Error(
        "No JSON array found in AI response.",
      );
    }

    return text.slice(
      first,
      last + 1,
    );
  }
}
