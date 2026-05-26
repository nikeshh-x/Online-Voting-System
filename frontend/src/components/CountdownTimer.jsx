import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

function CountdownTimer({ electionId, onStatusChange }) {
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountdown();
    const interval = setInterval(fetchCountdown, 1000); // Update every second
    return () => clearInterval(interval);
  }, [electionId]);

  const fetchCountdown = async () => {
    try {
      const response = await api.get(`/elections/${electionId}/countdown/`);
      if (response.data.status === 'success') {
        setCountdown(response.data.data);
        if (onStatusChange && response.data.data.status !== countdown?.status) {
          onStatusChange(response.data.data.status);
        }
      }
    } catch (error) {
      console.error('Error fetching countdown:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-3 text-center">
        <div className="animate-pulse">Loading timer...</div>
      </div>
    );
  }

  if (!countdown) {
    return null;
  }

  if (countdown.status === 'closed') {
    return (
      <div className="bg-gray-100 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <AlertCircle size={18} />
          <span className="font-medium">Election has ended</span>
        </div>
      </div>
    );
  }

  const isActive = countdown.status === 'active';
  const isLive = isActive && countdown.total_seconds > 0;

  return (
    <div className={`rounded-lg p-4 text-center ${isActive ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'}`}>
      {isLive && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">LIVE</span>
        </div>
      )}
      <p className="text-sm opacity-90 mb-2">{countdown.message}</p>
      <div className="flex justify-center gap-4 text-center">
        <div>
          <div className="text-2xl font-bold">{countdown.days}</div>
          <div className="text-xs opacity-75">Days</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{countdown.hours}</div>
          <div className="text-xs opacity-75">Hours</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{countdown.minutes}</div>
          <div className="text-xs opacity-75">Minutes</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{countdown.seconds}</div>
          <div className="text-xs opacity-75">Seconds</div>
        </div>
      </div>
    </div>
  );
}

export default CountdownTimer;