import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import api from '../services/api';

function CountdownTimer({ electionId, onStatusChange }) {
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSeconds, setShowSeconds] = useState(false);

  useEffect(() => {
    fetchCountdown();
    
    let interval;
    if (showSeconds) {
      interval = setInterval(fetchCountdown, 1000);
    } else {
      interval = setInterval(fetchCountdown, 60000);
    }
    
    return () => clearInterval(interval);
  }, [electionId, showSeconds]);

  const fetchCountdown = async () => {
    try {
      const response = await api.get(`/elections/${electionId}/countdown/`);
      if (response.data.status === 'success') {
        const data = response.data.data;
        
        // Check if election has ended
        if (data.status === 'closed' || (data.days === 0 && data.hours === 0 && data.minutes === 0 && data.seconds === 0 && data.total_seconds === 0)) {
          if (onStatusChange) onStatusChange('closed');
          setCountdown({ ...data, status: 'closed' });
          setLoading(false);
          return;
        }
        
        setCountdown(data);
        
        // Check if less than 1 minute remaining
        if (data.total_seconds < 60 && data.total_seconds > 0) {
          setShowSeconds(true);
        } else {
          setShowSeconds(false);
        }
        
        if (onStatusChange && data.status !== countdown?.status) {
          onStatusChange(data.status);
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

  // Election ended
  if (countdown.status === 'closed' || (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0)) {
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
  const lessThanMinute = countdown.total_seconds < 60 && countdown.total_seconds > 0;

  // Don't show negative values
  const displayDays = Math.max(0, countdown.days);
  const displayHours = Math.max(0, countdown.hours);
  const displayMinutes = Math.max(0, countdown.minutes);
  const displaySeconds = Math.max(0, countdown.seconds);

  return (
    <div className={`rounded-lg p-4 text-center ${isActive ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'}`}>
      {isLive && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">LIVE</span>
        </div>
      )}
      <p className="text-sm opacity-90 mb-2">{countdown.message}</p>
      
      {lessThanMinute ? (
        <div className="flex justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold">{displaySeconds}</div>
            <div className="text-xs opacity-75">Seconds</div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-6 text-center">
          <div>
            <div className="text-2xl font-bold">{displayDays}</div>
            <div className="text-xs opacity-75">Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{displayHours}</div>
            <div className="text-xs opacity-75">Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{displayMinutes}</div>
            <div className="text-xs opacity-75">Minutes</div>
          </div>
        </div>
      )}
      
      {lessThanMinute && displaySeconds > 0 && (
        <p className="text-sm font-semibold mt-2 animate-pulse">Less than a minute remaining!</p>
      )}
    </div>
  );
}

export default CountdownTimer;