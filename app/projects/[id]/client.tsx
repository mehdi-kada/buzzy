'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage, BUCKET_ID } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { useProject } from '@/hooks/useProjects';
import ProjectProgress from '@/components/projects/ProjectProgress';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';

export default function ProjectDetailsClient({ params, userId }: { params: { id: string }, userId: string }) {
  const router = useRouter();
  const { project, loading: loadingProject, error } = useProject(params.id, userId);
  const [clips, setClips] = useState<any[]>([]);

  useEffect(() => {
    if (!project) return;

    // Fetch clips from the clips collection instead of trying to get files directly
    const fetchClips = async () => {
      if (project.clipIds && project.clipIds.length > 0) {
        try {
          // Fetch clips data from the clips collection
          const response = await fetch(`/api/clips?videoId=${project.$id}&userId=${userId}`);
          if (response.ok) {
            const clipsData = await response.json();
            setClips(clipsData);
          } else {
            console.error('Failed to fetch clips:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching clips:', error);
        }
      }
    };

    fetchClips();
  }, [project, userId]);

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner className="h-32 w-32" />
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
                  <p className="mt-2 text-gray-500">
                    {project.description || 'No description provided'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Uploaded on {new Date(project.$createdAt).toLocaleDateString()}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : project.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                {project.thumbnailId && (
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32" />
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Progress</h3>
                <ProjectProgress 
                  progress={project.progress} 
                  status={project.status}
                  clipCount={project.clipIds?.length || 0}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {clips.length > 0 && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Clips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clips.map((clip) => (
                    <div key={clip.$id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-200 border-2 border-dashed w-full h-40 flex items-center justify-center">
                        <span className="text-gray-500">Video Preview</span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900">{clip.fileName}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{clip.text}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {Math.round(clip.sizeBytes / 1024)} KB • {Math.round(clip.duration / 1000)}s
                          </span>
                          <a 
                            href={storage.getFileView(BUCKET_ID, clip.bucketFileId).toString()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}