import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

function LiveVoteCount({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (count !== initialCount) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }
    setCount(initialCount);
  }, [initialCount]);

  return (
    <div className="flex items-center gap-2">
      <TrendingUp size={16} className="text-green-500" />
      <span className="text-sm text-gray-500">Total Votes:</span>
      <span className={`font-bold text-primary-600 ${animating ? 'scale-125 transition-transform' : ''}`}>
        {count}
      </span>
    </div>
  );
}

export default LiveVoteCount;