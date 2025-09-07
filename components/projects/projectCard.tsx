import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

type Project = {
  $id: string;
  title: string;
  description?: string | null;
  thumbnailId?: string | null;
  $createdAt: string;
  // status may come from the backend; include optional to be safe
  status?: 'uploaded' | 'processing' | 'completed' | 'failed' | string;
};

export default function ProjectCard({ project }: { project: Project }) {
  console.log("Rendering ProjectCard for project:", project);
  const isProcessing = project.status === 'processing' || project.status === 'uploaded';
  console.log("isProcessing:", isProcessing);
  const clickable = !isProcessing; // only clickable when not processing

  return (
    <div
      className={`bg-white overflow-hidden shadow rounded-lg ${!clickable ? 'opacity-90' : ''}`}
      aria-disabled={!clickable}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-3">
              {project.title}
              {isProcessing && (
                <span className="ml-2 inline-flex items-center text-sm text-gray-500">
                  <LoadingSpinner className="h-4 w-4" />
                  <span className="ml-2">Processing</span>
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {project.description || 'No description'}
            </p>
          </div>
          {project.thumbnailId && (
            <div className="ml-4 flex-shrink-0">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          {clickable ? (
            <Link
              href={`/projects/${project.$id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View details
            </Link>
          ) : (
            <span className="text-sm font-medium text-gray-400">Processing...</span>
          )}

          <span className="text-xs text-gray-500">
            {new Date(project.$createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
