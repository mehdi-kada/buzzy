'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import ProjectProgress from '@/components/projects/ProjectProgress';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { projects, loading: loadingProjects, error } = useProjects(user?.$id || '');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || loadingProjects) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner className="h-32 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Video Projects</h2>
            <Link 
              href="/upload" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upload Video
            </Link>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {projects.length === 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">Get started by uploading your first video</p>
              <Link 
                href="/upload" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upload Video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.$id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
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
                    
                    <div className="mt-4">
                      <ProjectProgress 
                        progress={project.progress} 
                        status={project.status}
                        clipCount={project.clipIds?.length || 0}
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-between">
                      <Link 
                        href={`/projects/${project.$id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View details
                      </Link>
                      <span className="text-xs text-gray-500">
                        {new Date(project.$createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}