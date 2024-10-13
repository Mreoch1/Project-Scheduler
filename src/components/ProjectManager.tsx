import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  domain: string;
}

const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    } else {
      setLoading(false);
      setError('Please log in to view and create projects.');
    }
  }, [currentUser]);

  const fetchProjects = async () => {
    if (currentUser) {
      try {
        setLoading(true);
        const userDomain = currentUser.email?.split('@')[1] || '';
        const isReconEnterprises = userDomain === 'reconenterprises.net';
        
        console.log('Current user:', currentUser.uid, 'Domain:', userDomain);

        let q;
        if (isReconEnterprises) {
          q = query(collection(db, 'projects'), where('domain', '==', userDomain));
          console.log('Querying projects for domain:', userDomain);
        } else {
          q = query(collection(db, 'projects'), where('createdBy', '==', currentUser.uid));
          console.log('Querying projects for user:', currentUser.uid);
        }
        
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot size:', querySnapshot.size);

        const fetchedProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        } as Project));
        setProjects(fetchedProjects);
        setError(null);
        console.log('Fetched projects:', fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim() && currentUser) {
      try {
        setLoading(true);
        const userDomain = currentUser.email?.split('@')[1] || '';
        const newProject = {
          name: newProjectName,
          createdAt: new Date(),
          createdBy: currentUser.uid,
          domain: userDomain,
        };
        console.log('Adding new project:', newProject);
        const projectDoc = await addDoc(collection(db, 'projects'), newProject);
        console.log('New project added with ID:', projectDoc.id);
        const createdProject = { id: projectDoc.id, ...newProject };
        setProjects(prevProjects => [...prevProjects, createdProject]);
        setNewProjectName('');
        setError(null);
        console.log('Updated projects list:', [...projects, createdProject]);
        
        // Fetch projects again to ensure the list is up-to-date
        fetchProjects();
      } catch (error) {
        console.error('Error adding project:', error);
        setError('Failed to create project. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'projects', id));
      setProjects(projects.filter(project => project.id !== id));
      setError(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <p>Please log in to view and create projects.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={addProject} className="mb-4">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New Project Name"
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Creating...' : 'Create New Project'}
        </button>
      </form>
      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects found. Create a new project above.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id} className="bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center">
              <div>
                <Link to={`/calendar/${project.id}`} className="font-semibold text-blue-600 hover:text-blue-800">
                  {project.name}
                </Link>
                <p className="text-sm text-gray-500">
                  Created on: {project.createdAt.toLocaleDateString()}
                  {project.createdBy !== currentUser?.uid && " (Group Project)"}
                </p>
              </div>
              {project.createdBy === currentUser?.uid && (
                <button
                  onClick={() => deleteProject(project.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  disabled={loading}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectManager;