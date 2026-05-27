import React from 'react';
import { Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

function StatusBadge({ status, endDateTime }) {
  // Calculate isEndingSoon here
  const isEndingSoon = endDateTime && new Date(endDateTime) - new Date() < 24 * 60 * 60 * 1000;
  
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: isEndingSoon ? 'Ending Soon' : 'Active',
          icon: isEndingSoon ? AlertCircle : PlayCircle,
          bgColor: isEndingSoon ? 'bg-orange-100' : 'bg-green-100',
          textColor: isEndingSoon ? 'text-orange-700' : 'text-green-700',
          dotColor: isEndingSoon ? 'bg-orange-500' : 'bg-green-500',
          pulse: true
        };
      case 'upcoming':
        return {
          label: 'Upcoming',
          icon: Clock,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          dotColor: 'bg-yellow-500',
          pulse: false
        };
      case 'closed':
        return {
          label: 'Closed',
          icon: CheckCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          dotColor: 'bg-gray-500',
          pulse: false
        };
      default:
        return {
          label: 'Draft',
          icon: AlertCircle,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          dotColor: 'bg-blue-500',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
      {config.pulse && (
        <div className={`w-2 h-2 ${config.dotColor} rounded-full animate-pulse`} />
      )}
      <Icon size={14} />
      <span className="text-xs font-medium">{config.label}</span>
      {isEndingSoon && status === 'active' && (
        <span className="text-xs font-semibold ml-1">⚠️</span>
      )}
    </div>
  );
}

export default StatusBadge;