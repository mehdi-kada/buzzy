export function relativeCreatedAt(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'Created recently';
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - then.getTime());
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'Created just now';
  if (mins < 60) return `Created ${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Created ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Created ${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  return `Created ${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

export function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function formatDuration(seconds: number): string {
  // Convert decimal seconds to hours, minutes, and seconds
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  // Format as HH:MM:SS or MM:SS
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}



export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

export const formatClipDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    return formatTime(seconds);
  };

export const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };