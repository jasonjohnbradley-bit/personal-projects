export interface ParsedPDFResult {
  places: string[];
  rawText: string;
  errors: string[];
}

type PdfParseFunction = (buffer: Buffer) => Promise<{ text: string }>;

/**
 * Extract text from PDF and identify place names
 * Uses pattern matching to find potential place names
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDFResult> {
  const result: ParsedPDFResult = { places: [], rawText: '', errors: [] };

  try {
    // Dynamic import to handle ESM/CJS compatibility
    const pdfParseModule = await import('pdf-parse') as unknown as { default?: PdfParseFunction } & PdfParseFunction;
    const pdf: PdfParseFunction = (pdfParseModule.default ?? pdfParseModule) as PdfParseFunction;
    const data = await pdf(buffer);
    result.rawText = data.text;

    // Extract potential place names using patterns
    const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      // Skip very long lines (likely paragraphs, not place names)
      if (line.length > 100) continue;

      // Skip lines that are just numbers or dates
      if (/^\d+$/.test(line) || /^\d{1,2}[\/\-]\d{1,2}/.test(line)) continue;

      // Skip common non-place patterns
      if (/^(page|chapter|section|introduction|conclusion|summary)/i.test(line)) continue;

      // Look for patterns that suggest place names:
      // - Lines starting with bullet points, numbers, or dashes
      const bulletPattern = /^[\-\*\•\d\.]+\s*(.+)/;
      const match = line.match(bulletPattern);

      if (match && match[1].length > 2 && match[1].length < 80) {
        result.places.push(match[1].trim());
      } else if (
        // Lines containing common place indicators
        line.includes('Restaurant') ||
        line.includes('Cafe') ||
        line.includes('Café') ||
        line.includes('Temple') ||
        line.includes('Shrine') ||
        line.includes('Museum') ||
        line.includes('Market') ||
        line.includes('Park') ||
        line.includes('Garden') ||
        line.includes('Station') ||
        line.includes('Tower') ||
        // Capitalized words pattern (likely proper nouns/place names)
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(line)
      ) {
        if (line.length > 2 && line.length < 80) {
          result.places.push(line);
        }
      }
    }

    // Deduplicate
    result.places = [...new Set(result.places)];

  } catch (error) {
    result.errors.push(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
