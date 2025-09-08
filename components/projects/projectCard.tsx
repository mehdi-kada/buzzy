import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useMemo, useRef } from 'react';
import type { ProjectCardData } from '@/types';
import { storage, BUCKET_ID } from '@/lib/appwrite';

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

function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function ProjectCard({ project }: { project: ProjectCardData }) {
  const normalized = (project.status || 'draft').toLowerCase();
  const status = statusConfig[normalized] || statusConfig.default;
  const isProcessing = normalized === 'processing' || normalized === 'uploaded';
  const isClickable = !isProcessing;
  const createdLabel = useMemo(() => relativeCreatedAt(project.$createdAt), [project.$createdAt]);
  const videoUrl = useMemo(() => storage.getFileView(BUCKET_ID, project.$id).toString(), [project.$id]);
  const posterUrl = useMemo(() => {
    if (!project.thumbnailId) return undefined;
    try {
      // Best-effort: if thumbnail is an image in the same bucket, generate a preview URL
      return storage.getFilePreview(BUCKET_ID, project.thumbnailId, 1280, 720).toString();
    } catch {
      return undefined;
    }
  }, [project.thumbnailId]);

  const metrics: string[] = [];
  if (project.clipCount) metrics.push(`${project.clipCount} clips`);
  if (project.postCount) metrics.push(`${project.postCount} posts`);
  if (project.viewCount) metrics.push(`${formatViewCount(project.viewCount)} views`);

  const Media = () => {
    const ref = useRef<HTMLVideoElement | null>(null);
    return (
      <div className="w-full overflow-hidden rounded-t-xl">
        <AspectRatio ratio={16 / 9}>
          <div
            className="relative h-full w-full bg-gray-100"
            onMouseEnter={() => ref.current?.play()}
            onMouseLeave={() => {
              if (ref.current) {
                ref.current.pause();
                ref.current.currentTime = 0;
              }
            }}
          >
            {/* Video preview */}
            <video
              ref={ref}
              src={videoUrl}
              poster={posterUrl}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />

            {/* Top gradient for chip readability */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/10 to-transparent" />

            {/* Status chip */}
            <div className="absolute left-3 top-3">
              <span
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 shadow-sm backdrop-blur',
                  status.bg,
                  status.text,
                  status.ring,
                ].join(' ')}
              >
                <span className="mr-1.5">{status.emoji}</span>
                {status.label}
                {isProcessing && (
                  <span className="ml-2 inline-flex items-center text-gray-500">
                    <LoadingSpinner className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
            </div>

            {/* Duration pill */}
            {project.duration && (
              <div className="absolute right-3 bottom-3">
                <div className="rounded bg-black/75 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                  {project.duration}
                </div>
              </div>
            )}
          </div>
        </AspectRatio>
      </div>
    );
  };

  const Content = () => (
    <div className="flex flex-col gap-3 p-4">
      <div className="space-y-1.5">
        <h3 className="truncate text-base font-semibold text-gray-900">
          {project.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {project.description || 'No description'}
        </p>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-500">{createdLabel}</div>
        {metrics.length > 0 && (
          <div className="text-xs text-gray-500">
            {metrics.join(' • ')}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Processing: generating clips…
          </div>
        )}
      </div>
    </div>
  );

  const Card = () => (
    <article
      className={[
        'group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
        'transition-all duration-200',
        isClickable ? 'hover:shadow-md hover:border-gray-300' : 'opacity-95',
      ].join(' ')}
      aria-disabled={!isClickable}
    >
      <Media />
      <Content />
    </article>
  );

  return isClickable ? (
    <Link href={`/projects/${project.$id}`} className="block">
      <Card />
    </Link>
  ) : (
    <Card />
  );
}
