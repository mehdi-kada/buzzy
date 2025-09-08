'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/projects/projectCard';
import LoadingSpinner from '@/components/LoadingSpinner';


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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.$id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}