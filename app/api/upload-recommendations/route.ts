import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/parsers/csvParser';
import { parsePDF } from '@/lib/parsers/pdfParser';
import { parseImage } from '@/lib/parsers/imageParser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    let places: string[] = [];
    let errors: string[] = [];

    // Route to appropriate parser based on file type
    if (fileName.endsWith('.csv') || mimeType === 'text/csv') {
      const text = buffer.toString('utf-8');
      const result = parseCSV(text);
      places = result.places;
      errors = result.errors;

    } else if (fileName.endsWith('.pdf') || mimeType === 'application/pdf') {
      const result = await parsePDF(buffer);
      places = result.places;
      errors = result.errors;

    } else if (
      mimeType.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp)$/.test(fileName)
    ) {
      // Validate image mime type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      let imageMimeType = mimeType;

      // Infer from extension if mime type is generic
      if (!validImageTypes.includes(mimeType)) {
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
          imageMimeType = 'image/jpeg';
        } else if (fileName.endsWith('.png')) {
          imageMimeType = 'image/png';
        } else if (fileName.endsWith('.gif')) {
          imageMimeType = 'image/gif';
        } else if (fileName.endsWith('.webp')) {
          imageMimeType = 'image/webp';
        } else {
          return NextResponse.json(
            { error: 'Unsupported image format. Supported: JPG, PNG, GIF, WebP' },
            { status: 400 }
          );
        }
      }

      const result = await parseImage(
        buffer,
        imageMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      );
      places = result.places;
      errors = result.errors;

    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType || fileName}. Supported: CSV, PDF, JPG, PNG, GIF, WebP` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      places,
      count: places.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
