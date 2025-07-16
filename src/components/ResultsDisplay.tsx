'use client';

import React from 'react';

interface Result {
  originalName: string;
  success: boolean;
  imageData?: string;
  error?: string;
}

interface ResultsDisplayProps {
  results: Result[];
  isProcessing: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isProcessing }) => {
  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = `model_wearing_${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    const successfulResults = results.filter(result => result.success && result.imageData);
    successfulResults.forEach(result => {
      downloadImage(result.imageData!, result.originalName);
    });
  };

  const successfulResults = results.filter(result => result.success);
  const failedResults = results.filter(result => !result.success);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Generated Model Images
        </h2>
        {successfulResults.length > 0 && (
          <button
            onClick={downloadAllImages}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download All ({successfulResults.length})
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-blue-700">Processing images... This may take a few minutes.</p>
          </div>
        </div>
      )}

      {/* Successful Results */}
      {successfulResults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            Successfully Generated ({successfulResults.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {successfulResults.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {result.imageData ? (
                    <img
                      src={`data:image/png;base64,${result.imageData}`}
                      alt={`Model wearing ${result.originalName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 truncate mb-2">
                    {result.originalName}
                  </p>
                  <button
                    onClick={() => downloadImage(result.imageData!, result.originalName)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Results */}
      {failedResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            Failed to Process ({failedResults.length})
          </h3>
          <div className="space-y-3">
            {failedResults.map((result, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-900">{result.originalName}</p>
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay; 