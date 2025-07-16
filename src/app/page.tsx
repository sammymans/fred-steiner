'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultsDisplay from '@/components/ResultsDisplay';

interface Result {
  originalName: string;
  success: boolean;
  imageData?: string;
  error?: string;
}

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);

  // Image compression function
  const compressImage = (file: File, maxSizeKB: number = 4000): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions to stay under size limit
        let { width, height } = img;
        const maxDimension = 2048; // Max width/height for good quality
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels until under size limit
        const tryCompress = (quality: number) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { 
                type: 'image/jpeg',
                lastModified: file.lastModified 
              });
              
              if (compressedFile.size <= maxSizeKB * 1024 || quality <= 0.1) {
                console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(compressedFile);
              } else {
                tryCompress(quality - 0.1);
              }
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress(0.8); // Start with 80% quality
      };
      
      img.onerror = () => {
        // If image can't be loaded, return original file
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFilesSelected = async (files: File[]) => {
    setIsCompressing(true);
    setResults([]); // Clear previous results
    setCurrentProgress(0);
    setTotalImages(0);

    try {
      // Calculate original total size
      const originalTotalSize = files.reduce((total, file) => total + file.size, 0);
      
      // Compress all images
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          // Only compress if file is larger than 4MB
          if (file.size > 4 * 1024 * 1024) {
            return await compressImage(file);
          }
          return file;
        })
      );

      // Calculate compressed total size
      const compressedTotalSize = compressedFiles.reduce((total, file) => total + file.size, 0);
      
      // Log the results
      console.log('📊 Compression Results:');
      console.log(`Original total size: ${(originalTotalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Compressed total size: ${(compressedTotalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total reduction: ${(((originalTotalSize - compressedTotalSize) / originalTotalSize) * 100).toFixed(1)}%`);
      console.log(`Number of files: ${compressedFiles.length}`);
      console.log(`Average size per file: ${(compressedTotalSize / compressedFiles.length / 1024 / 1024).toFixed(2)} MB`);

      setSelectedFiles(compressedFiles);
    } catch (error) {
      console.error('Error compressing images:', error);
      setSelectedFiles(files); // Fallback to original files
    }
    
    setIsCompressing(false);
  };

  const handleGenerateImages = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    setCurrentProgress(0);
    setTotalImages(selectedFiles.length);

    const allResults: Result[] = [];

    // Process each image individually to avoid Vercel's 4.5MB limit
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentProgress(i + 1);

      try {
        const formData = new FormData();
        formData.append('images', file); // Send ONE image at a time

        const response = await fetch('/api/generate-model-images', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate image');
        }

        const data = await response.json();
        allResults.push(...data.results);
        setResults([...allResults]); // Show results as they complete!
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        allResults.push({
          originalName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate image',
        });
        setResults([...allResults]);
      }
    }

    setIsProcessing(false);
    setCurrentProgress(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Model Image Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload clothing flatlay images and generate professional photos of models wearing your clothes
          </p>
        </div>

        <FileUpload 
          onFilesSelected={handleFilesSelected}
          isProcessing={isProcessing || isCompressing}
        />

        {/* Image Compression Loading */}
        {isCompressing && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Compressing images for optimal processing...</span>
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && !isCompressing && (
          <div className="text-center mt-8">
            <button
              onClick={handleGenerateImages}
              disabled={isProcessing}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Images...
                </div>
              ) : (
                `Generate Model Images (${selectedFiles.length})`
              )}
            </button>
          </div>
        )}

        {/* Loading Progress Display */}
        {isProcessing && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Please wait...
                  </h3>
                </div>
                <p className="text-gray-600">
                  AI is generating professional model images from your clothing photos
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{currentProgress} of {totalImages}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(currentProgress / totalImages) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Status */}
              <div className="text-center">
                {currentProgress === 0 ? (
                  <p className="text-gray-500">Starting image generation...</p>
                ) : currentProgress < totalImages ? (
                  <p className="text-blue-600 font-medium">
                    Generating image {currentProgress} of {totalImages}
                  </p>
                ) : (
                  <p className="text-green-600 font-medium">
                    Processing complete! Finalizing results...
                  </p>
                )}
              </div>

              {/* Time Estimate */}
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>
                  Estimated time: ~{Math.ceil((totalImages - currentProgress) * 0.75)} minutes remaining
                </p>
                <p className="mt-1">
                  Each image takes approximately 30-60 seconds to generate
                </p>
              </div>
            </div>
          </div>
        )}

        <ResultsDisplay 
          results={results}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}
