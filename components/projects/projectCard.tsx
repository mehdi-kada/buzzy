import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMemo } from 'react';

type Project = {
  $id: string;
  title: string;
  description?: string | null;
  thumbnailId?: string | null;
  $createdAt: string;
  status?: 'uploaded' | 'processing' | 'completed' | 'failed' | 'published' | string;
  duration?: string; // Added for duration display like "12:34"
  clipCount?: number; // Added for clips count
  postCount?: number; // Added for posts count  
  viewCount?: number; // Added for view count
};

// Map backend statuses to UI chips (emoji + label + colors)
const statusConfig: Record<string, { emoji: string; label: string; bg: string; text: string; ring: string }> = {
  completed:  { emoji: '✓',  label: 'Completed',  bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  published:  { emoji: '✓',  label: 'Published',  bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  processing: { emoji: '⏳', label: 'Processing', bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200' },
  uploaded:   { emoji: '⏳', label: 'Processing', bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200' },
  failed:     { emoji: '❌', label: 'Failed',     bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200' },
  draft:      { emoji: '📝', label: 'Draft',      bg: 'bg-slate-50',   text: 'text-slate-700',   ring: 'ring-slate-200' },
  default:    { emoji: '📝', label: 'Draft',      bg: 'bg-slate-50',   text: 'text-slate-700',   ring: 'ring-slate-200' },
};

function relativeCreatedAt(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  if (mins < 60) return `Created ${mins || 1} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Created ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Created ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `Created ${weeks} weeks ago`;
}

function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function ProjectCard({ project }: { project: Project }) {
  const normalized = (project.status || 'draft').toLowerCase();
  const status = statusConfig[normalized] || statusConfig.default;
  const isProcessing = normalized === 'processing' || normalized === 'uploaded';
  const isClickable = !isProcessing;
  const createdLabel = useMemo(() => relativeCreatedAt(project.$createdAt), [project.$createdAt]);

  const CardContent = () => (
    <div className="grid grid-cols-12 gap-4 p-0">
      {/* Large thumbnail left column */}
      <div className="col-span-5 p-4">
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-40 md:h-48">
          {project.thumbnailId ? (
            // Placeholder gradient; swap for <img> when available
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" aria-hidden="true" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="h-24 w-40 rounded-md border-2 border-dashed border-gray-200 bg-transparent" />
            </div>
          )}

          {/* Overlay: status chip (top-left) */}
          <div className="absolute left-3 top-3">
            <span
              className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
                status.bg,
                status.text,
                status.ring
              ].join(' ')}
            >
              <span className="mr-1">{status.emoji}</span>
              {status.label}
              {isProcessing && (
                <span className="ml-2 inline-flex items-center text-gray-500">
                  <LoadingSpinner className="h-3.5 w-3.5" />
                </span>
              )}
            </span>
          </div>

          {/* Overlay: duration (bottom-right) */}
          {project.duration && (
            <div className="absolute right-3 bottom-3">
              <div className="bg-black/75 text-white text-sm font-medium px-3 py-1 rounded">
                {project.duration}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column: content */}
      <div className="col-span-7 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {project.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {project.description || 'No description'}
          </p>

          <div className="text-sm text-gray-500 space-y-1">
            <div>{createdLabel}</div>
            {project.duration && <div>{project.duration} duration</div>}

            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm">
              {project.clipCount && (
                <span>{project.clipCount} clips</span>
              )}
              {project.postCount && (
                <span>{project.postCount} posts</span>
              )}
              {project.viewCount && (
                <span>{formatViewCount(project.viewCount)} views</span>
              )}
            </div>

            {/* Processing status */}
            {isProcessing && (
              <div className="text-amber-600 text-sm">
                Processing: Transcription complete, generating clips...
              </div>
            )}
          </div>
        </div>
      </div>
  </div>
  );

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-lg bg-white border border-gray-200',
        'transition-all duration-200',
        isClickable ? 'hover:shadow-md hover:border-gray-300 cursor-pointer' : 'opacity-90',
      ].join(' ')}
      aria-disabled={!isClickable}
    >
      {isClickable ? (
        <Link href={`/projects/${project.$id}`} className="block">
          <CardContent />
        </Link>
      ) : (
        <CardContent />
      )}
    </div>
  );
}
