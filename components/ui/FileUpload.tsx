'use client';

import { useState, useRef, useCallback } from 'react';

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

interface FileUploadProps {
  onPlacesExtracted: (places: EnrichedPlace[] | string[]) => void;
  destination?: string;
  disabled?: boolean;
}

export function FileUpload({ onPlacesExtracted, destination, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ count: number; enriched: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setLastResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (destination) {
        formData.append('destination', destination);
      }

      const response = await fetch('/api/upload-recommendations', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.places && data.places.length > 0) {
        onPlacesExtracted(data.places);
        setLastResult({
          count: data.places.length,
          enriched: data.enriched || false
        });
      } else {
        setError('No place names found in the file');
      }

      if (data.errors && data.errors.length > 0) {
        console.warn('Parser warnings:', data.errors);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, [onPlacesExtracted, destination]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isProcessing) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile, disabled, isProcessing]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled || isProcessing ? -1 : 0}
        aria-label="Upload file with recommendations"
        aria-disabled={disabled || isProcessing}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf,.jpg,.jpeg,.png,.gif,.webp,image/*"
          onChange={handleFileSelect}
          disabled={disabled || isProcessing}
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="upload-status">
            <span className="spinner-small" />
            <p>Extracting and enriching places...</p>
          </div>
        ) : (
          <div className="upload-content">
            <span className="upload-icon">📎</span>
            <p className="upload-text">
              <strong>Drop file here</strong> or click to upload
            </p>
            <p className="upload-hint">
              Supports CSV, PDF, or images (screenshots)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="upload-error">{error}</p>
      )}

      {lastResult && (
        <p className="upload-success">
          Added {lastResult.count} place{lastResult.count !== 1 ? 's' : ''} from file
          {lastResult.enriched && ' with location details'}
        </p>
      )}
    </div>
  );
}
