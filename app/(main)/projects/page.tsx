'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/projects/projectCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ProjectsPagination } from '@/components/projects/Pagination';


export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { projects, loading: loadingProjects, error, currentPage, setCurrentPage, totalPages } = useProjects(user?.$id || '');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  from-amber-50 to-yellow-50 dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Your Video Projects</h2>
            <Link 
              href="/upload" 
              className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 shadow-sm ring-1 ring-amber-300/60"
            >
              Upload Video
            </Link>
          </div>
          
          {error && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-950 dark:to-gray-900 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 mb-6">
              <p className="text-amber-900 dark:text-amber-200">{error}</p>
            </div>
          )}
          
          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg p-8 text-center border border-amber-100 dark:border-amber-900/40">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">No projects yet</h3>
              <p className="text-amber-800/80 dark:text-amber-200/80 mb-4">Get started by uploading your first video</p>
              <Link 
                href="/upload" 
                className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 shadow-sm ring-1 ring-amber-300/60"
              >
                Upload Video
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.$id} project={project} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <ProjectsPagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}