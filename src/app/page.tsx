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

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setResults([]); // Clear previous results
    setCurrentProgress(0);
    setTotalImages(0);
  };

  const handleGenerateImages = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    setCurrentProgress(0);
    setTotalImages(selectedFiles.length);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Simulate progress updates since we're processing sequentially
      const progressInterval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev < selectedFiles.length) {
            return prev + 1;
          }
          return prev;
        });
      }, 45000); // Update every 45 seconds (average processing time)

      const response = await fetch('/api/generate-model-images', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setCurrentProgress(selectedFiles.length); // Complete

      if (!response.ok) {
        throw new Error('Failed to generate images');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error generating images:', error);
      // Show error to user
      setResults([{
        originalName: 'Error',
        success: false,
        error: 'Failed to generate images. Please try again.',
      }]);
    } finally {
      setIsProcessing(false);
      setCurrentProgress(0);
    }
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
          isProcessing={isProcessing}
        />

        {selectedFiles.length > 0 && (
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
