import React from 'react';

function TurnoutGauge({ percentage, size = 80 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = (pct) => {
    if (pct >= 70) return '#22c55e';
    if (pct >= 40) return '#eab308';
    return '#ef4444';
  };
  
  const getTextColor = (pct) => {
    if (pct >= 70) return 'text-green-600';
    if (pct >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(percentage)}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${getTextColor(percentage)}`}>{percentage}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500">Voter Turnout</p>
        <p className="text-sm font-medium text-gray-700">{percentage}% of eligible voters</p>
      </div>
    </div>
  );
}

export default TurnoutGauge;