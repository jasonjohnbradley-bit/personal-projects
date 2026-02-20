import Anthropic from '@anthropic-ai/sdk';
import type { ParsedPlace } from './csvParser';
import { normalizePrice, normalizeRating } from '../claude/parse';

export interface EnrichedPlace {
  name: string;
  type?: string;
  link?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  rating?: string;
  price?: string;
  address?: string;
}

/**
 * Enrich parsed places with location details using Claude AI.
 * Returns coordinates, ratings, and price levels for each place.
 */
export async function enrichPlacesWithClaude(
  places: ParsedPlace[],
  destination: string
): Promise<EnrichedPlace[]> {
  if (places.length === 0) {
    return [];
  }

  const client = new Anthropic();

  const placesList = places
    .map((p, i) => `${i + 1}. ${p.name}${p.type ? ` (${p.type})` : ''}`)
    .join('\n');

  const prompt = `You are a travel expert. For these places in or near ${destination}, provide their approximate coordinates, Google rating, and price level.

Places to look up:
${placesList}

Return a JSON array with exactly ${places.length} objects in the same order. Each object should have:
- "lat": number (latitude, e.g. 35.6762)
- "lng": number (longitude, e.g. 139.6503)
- "rating": string (e.g. "4.5" or null if unknown)
- "price": string (e.g. "$", "$$", "$$$", "$$$$" or null if unknown/free)
- "address": string (brief address or neighborhood, e.g. "Shibuya, Tokyo")

If you don't know a place, make your best estimate based on the name and type, or use null for unknown fields.

Return ONLY the JSON array, no markdown code blocks or other text.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    let enrichedData: Array<{
      lat?: number;
      lng?: number;
      rating?: string;
      price?: string;
      address?: string;
    }>;

    try {
      // Clean potential markdown formatting
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      enrichedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent.text);
      throw new Error('Failed to parse enrichment data');
    }

    // Merge enriched data with original place data
    return places.map((place, i) => {
      const enrichment = enrichedData[i] || {};
      return {
        name: place.name,
        type: place.type,
        link: place.link,
        notes: place.notes,
        lat: enrichment.lat,
        lng: enrichment.lng,
        rating: normalizeRating(enrichment.rating),
        price: normalizePrice(enrichment.price),
        address: enrichment.address || undefined,
      };
    });
  } catch (error) {
    console.error('Claude enrichment failed:', error);
    // Return original places without enrichment on error
    return places.map(place => ({
      name: place.name,
      type: place.type,
      link: place.link,
      notes: place.notes,
    }));
  }
}
