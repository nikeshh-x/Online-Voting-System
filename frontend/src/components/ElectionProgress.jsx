import React from 'react';

function ElectionProgress({ startDate, endDate, status }) {
  if (status !== 'active') return null;
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const total = end - start;
  const elapsed = now - start;
  let progress = (elapsed / total) * 100;
  
  // Clamp progress between 0 and 100
  progress = Math.min(100, Math.max(0, progress));
  
  const getProgressColor = () => {
    if (progress < 33) return 'bg-green-500';
    if (progress < 66) return 'bg-yellow-500';
    return 'bg-orange-500';
  };
  
  const getStatusText = () => {
    if (progress < 33) return 'Just started';
    if (progress < 66) return 'In progress';
    if (progress < 90) return 'Almost over';
    return 'Ending soon';
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Started</span>
        <span>{getStatusText()}</span>
        <span>Ending</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${getProgressColor()} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{new Date(startDate).toLocaleDateString()}</span>
        <span>{Math.round(progress)}% complete</span>
        <span>{new Date(endDate).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export default ElectionProgress;