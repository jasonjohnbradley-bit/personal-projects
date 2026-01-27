import Papa from 'papaparse';

export interface ParsedCSVResult {
  places: string[];
  errors: string[];
}

/**
 * Parse CSV file and extract place names
 * Looks for columns named: name, place, location, title, destination, recommendation, spot
 */
export function parseCSV(csvText: string): ParsedCSVResult {
  const result: ParsedCSVResult = { places: [], errors: [] };

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim(),
  });

  if (parsed.errors.length > 0) {
    result.errors = parsed.errors.map(e => e.message);
  }

  const placeColumns = ['name', 'place', 'location', 'title', 'destination', 'recommendation', 'spot', 'restaurant', 'cafe', 'attraction'];

  for (const row of parsed.data as Record<string, string>[]) {
    let foundPlace = false;

    // Try to find place name in common column names
    for (const col of placeColumns) {
      if (row[col] && row[col].trim()) {
        result.places.push(row[col].trim());
        foundPlace = true;
        break;
      }
    }

    // If no standard column found, take the first non-empty value
    if (!foundPlace) {
      const firstValue = Object.values(row).find(v => v && typeof v === 'string' && v.trim());
      if (firstValue) {
        result.places.push(firstValue.trim());
      }
    }
  }

  // Deduplicate and filter empty
  result.places = [...new Set(result.places)].filter(Boolean);

  return result;
}
