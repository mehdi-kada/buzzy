// utils/videoValidation.js
export const validateVideoFile = (file: any) => {
  const validTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime'
  ];
  
  const maxSize = 100 * 1024 * 1024; // 100MB
  const minSize = 1024; // 1KB
  
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }
  
  if (!validTypes.includes(file.type)) {
    errors.push(`Invalid file type. Supported formats: ${validTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }
  
  if (file.size < minSize) {
    errors.push(`File too small. Minimum size: ${minSize} bytes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    }
  };
};

export const getVideoDuration = (file: any) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      resolve(null);
    };
    
    video.src = URL.createObjectURL(file);
  });
};
