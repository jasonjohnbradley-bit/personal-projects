import Papa from 'papaparse';

export interface ParsedPlace {
  name: string;
  type?: string;
  link?: string;
  notes?: string;
}

export interface ParsedCSVResult {
  places: ParsedPlace[];
  errors: string[];
}

// Name patterns - used to identify the place name column (removed 'place' as it's a type column header)
const HEADER_PATTERNS = ['name', 'location', 'title', 'destination', 'restaurant', 'cafe', 'spot', 'attraction'];
// Type patterns - used to identify the category/type column (added 'place' for "Place" header)
const TYPE_PATTERNS = ['type', 'category', 'place', 'restaurant', 'bakery', 'coffee'];
const LINK_PATTERNS = ['link', 'url', 'map', 'google'];
const NOTES_PATTERNS = ['notes', 'hours', 'opening', 'comment', 'info'];
const CATEGORY_WORDS = ['bakery', 'coffee', 'restaurant', 'shopping', 'dessert', 'cafe', 'market', 'beauty'];

/**
 * Validate that a string is a valid place name (not currency, numbers, or too short)
 */
function isValidPlaceName(name: string): boolean {
  if (!name || name.length < 2) return false;
  // Reject strings that are only currency symbols, numbers, or whitespace
  if (/^[$¥€£₹₩\d\s.,]+$/.test(name)) return false;
  // Reject single characters
  if (name.length === 1) return false;
  return true;
}

/**
 * Parse CSV file and extract place objects with name, type, link, and notes.
 * Handles CSVs with title/header rows before actual data.
 */
export function parseCSV(csvText: string): ParsedCSVResult {
  const result: ParsedCSVResult = { places: [], errors: [] };

  // Parse as raw arrays first (no automatic header detection)
  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    result.errors = parsed.errors.map(e => e.message);
  }

  const rows = parsed.data as string[][];
  if (rows.length === 0) return result;

  // Find header row (first row containing header-like words)
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const lowerRow = row.map(cell => (cell || '').toLowerCase().trim());

    // Check for name patterns OR type patterns (for "Place,Name,Link" format)
    const hasHeaderWord = lowerRow.some(cell =>
      HEADER_PATTERNS.some(pattern => cell.includes(pattern)) ||
      TYPE_PATTERNS.some(pattern => cell.includes(pattern))
    );

    if (hasHeaderWord) {
      headerRowIndex = i;
      headers = lowerRow;
      break;
    }
  }

  // Find column indices
  let nameColIndex = -1;
  let typeColIndex = -1;
  let linkColIndex = -1;
  let notesColIndex = -1;

  if (headerRowIndex >= 0) {
    // Check for exact "Place,Name,Link" format first (most common format)
    const hasPlaceHeader = headers.some(h => h.trim() === 'place');
    const hasNameHeader = headers.some(h => h.trim() === 'name');
    const hasLinkHeader = headers.some(h => h.trim() === 'link');

    if (hasPlaceHeader && hasNameHeader && hasLinkHeader) {
      // Explicit column mapping for Place,Name,Link format
      typeColIndex = headers.findIndex(h => h.trim() === 'place');
      nameColIndex = headers.findIndex(h => h.trim() === 'name');
      linkColIndex = headers.findIndex(h => h.trim() === 'link');
    } else {
      // Fall back to pattern-based detection

      // Find name column - prioritize exact "name" match
      nameColIndex = headers.findIndex(h => h.trim() === 'name');
      if (nameColIndex === -1) {
        nameColIndex = headers.findIndex(h => h.includes('name'));
      }
      if (nameColIndex === -1) {
        for (const pattern of HEADER_PATTERNS) {
          nameColIndex = headers.findIndex(h => h.includes(pattern));
          if (nameColIndex >= 0) break;
        }
      }

      // Find type/description column
      typeColIndex = headers.findIndex(h =>
        TYPE_PATTERNS.some(pattern => h.includes(pattern))
      );

      // Find link column
      linkColIndex = headers.findIndex(h =>
        LINK_PATTERNS.some(pattern => h.includes(pattern))
      );
    }

    // Find notes/hours column
    notesColIndex = headers.findIndex(h =>
      NOTES_PATTERNS.some(pattern => h.includes(pattern))
    );
  }

  // Extract places from data rows
  const dataStartRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    let placeName: string | null = null;
    let placeType: string | null = null;
    let placeLink: string | null = null;
    let placeNotes: string | null = null;

    // Get type if available
    if (typeColIndex >= 0 && row[typeColIndex]?.trim()) {
      placeType = row[typeColIndex].trim();
    }

    // Get link if available
    if (linkColIndex >= 0 && row[linkColIndex]?.trim()) {
      const link = row[linkColIndex].trim();
      if (link.startsWith('http')) {
        placeLink = link;
      }
    }

    // Fallback: scan all columns for URLs if no link found
    if (!placeLink) {
      for (const cell of row) {
        const trimmed = (cell || '').trim();
        if (trimmed.startsWith('http')) {
          placeLink = trimmed;
          break;
        }
      }
    }

    // Get notes if available
    if (notesColIndex >= 0 && row[notesColIndex]?.trim()) {
      placeNotes = row[notesColIndex].trim();
    }

    if (nameColIndex >= 0 && row[nameColIndex]?.trim()) {
      // Use the identified name column
      placeName = row[nameColIndex].trim();
    } else {
      // Fallback: find best candidate (longest non-category value)
      const candidates = row
        .map(cell => (cell || '').trim())
        .filter(cell => {
          if (!cell) return false;
          const lower = cell.toLowerCase();
          if (CATEGORY_WORDS.some(cat => lower === cat)) return false;
          if (cell.length < 3) return false;
          if (cell.startsWith('http')) return false;
          return true;
        });

      if (candidates.length > 0) {
        placeName = candidates.reduce((a, b) => a.length > b.length ? a : b);
      }
    }

    // Validate place name before adding
    if (placeName && isValidPlaceName(placeName) && !HEADER_PATTERNS.some(h => placeName!.toLowerCase() === h)) {
      const place: ParsedPlace = { name: placeName };
      if (placeType) place.type = placeType;
      if (placeLink) place.link = placeLink;
      if (placeNotes) place.notes = placeNotes;
      result.places.push(place);
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  result.places = result.places.filter(place => {
    if (seen.has(place.name)) return false;
    seen.add(place.name);
    return true;
  });

  return result;
}

/**
 * Legacy function for backward compatibility - returns just place names as strings
 */
export function parseCSVToStrings(csvText: string): { places: string[]; errors: string[] } {
  const result = parseCSV(csvText);
  return {
    places: result.places.map(p => p.type ? `${p.type}: ${p.name}` : p.name),
    errors: result.errors,
  };
}
