import React from 'react';

interface ProjectProgressProps {
  progress: number;
  status: 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
  clipCount?: number;
  className?: string;
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({ 
  progress, 
  status, 
  clipCount = 0,
  className = '' 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'processing':
        return 'bg-blue-600';
      case 'pending':
      case 'uploaded':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'uploaded':
        return 'Uploaded';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
        <span className="text-sm text-gray-500">
          {progress}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {clipCount > 0 && (
        <div className="text-xs text-gray-500">
          {clipCount} clip{clipCount !== 1 ? 's' : ''} generated
        </div>
      )}
    </div>
  );
};

export default ProjectProgress;