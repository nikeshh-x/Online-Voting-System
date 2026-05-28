import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const SkeletonStats = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;