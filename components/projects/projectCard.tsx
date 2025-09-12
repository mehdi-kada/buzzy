import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useMemo } from 'react';
import type { ProjectCardData } from '@/types';
import { storage, THUMBNAIL_BUCKET_ID } from '@/lib/appwrite';
import { statusConfig } from '@/lib/constants';
import { relativeCreatedAt, formatViewCount, formatDuration } from '@/lib/projects/helperFunctions';



export default function ProjectCard({ project }: { project: ProjectCardData }) {
  const normalized = (project.status || 'processing').toLowerCase();
  const status = statusConfig[normalized] || statusConfig.default;
  const isProcessing = normalized === 'processing' || normalized === 'uploaded';
  const isClickable = !isProcessing;
  const createdLabel = useMemo(() => relativeCreatedAt(project.$createdAt), [project.$createdAt]);
  const posterUrl = useMemo(() => {
    if (!project.thumbnailId) return undefined;
    try {
      return storage.getFilePreview(THUMBNAIL_BUCKET_ID, project.thumbnailId, 1280, 720).toString();
    } catch {
      return undefined;
    }
  }, [project.thumbnailId]);

  const metrics: string[] = [];
  if (project.clipCount) metrics.push(`${project.clipCount} clips`);
  if (project.postCount) metrics.push(`${project.postCount} posts`);
  if (project.viewCount) metrics.push(`${formatViewCount(project.viewCount)} views`);

  const Media = () => {
    return (
      <div className="w-full overflow-hidden rounded-t-xl">
        <AspectRatio ratio={16 / 9}>
          <div className="relative h-full w-full bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-200 dark:ring-amber-800">
            {/* Thumbnail image */}
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <span className="text-amber-700 dark:text-amber-300">No thumbnail</span>
              </div>
            )}

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
              </span>
            </div>

            {/* Duration pill */}
            {project.duration && (
              <div className="absolute right-3 bottom-3">
                <div className="rounded bg-black/70 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                  {formatDuration(Number(project.duration))}
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
        <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
          {project.title}
        </h3>
        <p className="text-sm text-amber-900/80 dark:text-amber-200/80 line-clamp-2">
          {project.description || 'No description'}
        </p>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-amber-800/80 dark:text-amber-300/80">{createdLabel}</div>
        {metrics.length > 0 && (
          <div className="text-xs text-amber-800/80 dark:text-amber-300/80">
            {metrics.join(' • ')}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <LoadingSpinner className="h-2 w-2 text-amber-700 dark:text-amber-300" />
            <span>Processing: generating clips…</span>
          </div>
        )}
      </div>
    </div>
  );

  const Card = () => (
    <article
      className={[
        'group relative overflow-hidden rounded-xl border shadow-sm',
        'transition-all duration-200',
        'border-amber-100 hover:border-amber-200',
        'bg-white dark:bg-gray-900',
        'dark:border-amber-900/40',
        isClickable ? 'hover:shadow-md' : 'opacity-95',
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
