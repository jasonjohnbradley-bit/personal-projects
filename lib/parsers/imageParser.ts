import { anthropic } from '@/lib/claude/client';

export interface ParsedImageResult {
  places: string[];
  errors: string[];
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

/**
 * Use Claude Vision API to extract place names from images
 */
export async function parseImage(
  imageBuffer: Buffer,
  mimeType: ImageMediaType
): Promise<ParsedImageResult> {
  const result: ParsedImageResult = { places: [], errors: [] };

  try {
    const base64Image = imageBuffer.toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Extract all place names, restaurant names, cafe names, attraction names, or location recommendations from this image.

This could be a screenshot of a travel guide, social media post, article, blog, or list of recommendations.

Return ONLY a JSON array of place names, nothing else. Example:
["Place Name 1", "Restaurant Name", "Temple Name"]

Rules:
- Extract specific place names, not generic descriptions
- Include restaurant names, cafe names, tourist attractions, temples, museums, markets, etc.
- If you see ratings or reviews, extract the place name being reviewed
- If the image shows a map, extract any labeled locations
- If you cannot identify any place names, return an empty array: []

Return ONLY the JSON array, no other text.`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';

    // Parse the JSON response
    const cleanedResponse = responseText.trim();

    // Try to extract JSON array from the response
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const places = JSON.parse(jsonMatch[0]);
      if (Array.isArray(places)) {
        result.places = places.filter(p => typeof p === 'string' && p.trim()).map(p => p.trim());
      }
    }

  } catch (error) {
    result.errors.push(`Failed to parse image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
