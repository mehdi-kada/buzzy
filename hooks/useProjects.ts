import { useEffect, useState, useCallback } from 'react';
import { Models } from 'appwrite';

export interface Project extends Models.Document {
  title: string;
  description: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  progress: number;
  clipIds?: string[];
  thumbnailId?: string;
}

export const useProjects = (userId: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
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