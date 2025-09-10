import { useEffect, useState, useCallback } from 'react';
import { Models } from 'appwrite';

export interface Project extends Models.Document {
  title: string;
  description: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  clipIds?: string[];
  thumbnailId?: string;
}

export const useProjects = (userId: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProjects = useCallback(async (page: number = 1) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects?userId=${userId}&page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects(currentPage);
  }, [fetchProjects, currentPage]);

  return { projects, loading, error, refetch: fetchProjects, currentPage, setCurrentPage, totalPages };
};

export const useProject = (projectId: string, userId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      
      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading, error, refetch: fetchProject };
};