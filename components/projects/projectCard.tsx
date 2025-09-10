import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useMemo } from 'react';
import type { ProjectCardData } from '@/types';
import { storage, THUMBNAIL_BUCKET_ID } from '@/lib/appwrite';
import { statusConfig } from '@/lib/constants';
import { relativeCreatedAt, formatViewCount, formatDuration } from '@/lib/projects/helperFunctions';



export default function ProjectCard({ project }: { project: ProjectCardData }) {
  const normalized = (project.status || 'draft').toLowerCase();
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
          <div className="relative h-full w-full bg-gray-100">
            {/* Thumbnail image */}
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 h-full w-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No thumbnail</span>
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
                <div className="rounded bg-black/75 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
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
            <LoadingSpinner className="h-2 w-2 text-amber-700" />
            <span>Processing: generating clips…</span>
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
