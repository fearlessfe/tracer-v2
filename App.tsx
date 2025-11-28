import React, { useState } from 'react';
import { HashRouter, Routes, Route, Outlet, useParams, Navigate } from 'react-router-dom';
import { ProjectList } from './pages/ProjectList';
import { Dashboard } from './pages/Dashboard';
import { AIAssistant } from './pages/AIAssistant';
import { Traceability } from './pages/Traceability';
import { DataSources, Documents, DocumentReview } from './pages/DataDocs';
import { Sidebar } from './components/Layout';
import { Project } from './types';

// Mock Initial Data
const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'ADAS L2+ System',
    description: 'Advanced Driver Assistance System including Lane Keep Assist and Adaptive Cruise Control for 2025 Platform.',
    type: 'General',
    members: ['Alice Chen', 'Bob Smith'],
    createdAt: '2023-09-15',
    stats: { requirements: 142, tests: 315, bugs: 7, coverage: 78 },
    dataSources: [
      {
        id: 'ds-1',
        name: 'ADAS Core Repo',
        type: 'Git',
        status: 'Synced',
        isEnabled: true,
        lastSync: '10 mins ago',
        config: { url: 'https://github.com/company/adas-core.git', branch: 'main' },
        documents: [
          { id: 'doc-1-1', name: 'README.md', type: 'Markdown', size: '4 KB', lastModified: '2023-10-20', parsingStatus: 'Verified', isEnabled: true },
          { id: 'doc-1-2', name: 'docs/architecture_spec.md', type: 'Markdown', size: '12 KB', lastModified: '2023-10-18', parsingStatus: 'ReviewNeeded', isEnabled: true },
          { id: 'doc-1-3', name: 'src/radar_control.c', type: 'Source Code', size: '45 KB', lastModified: '2023-10-22', parsingStatus: 'Unparsed', isEnabled: true }
        ]
      },
      {
        id: 'ds-2',
        name: 'Jira Issues',
        type: 'Jira',
        status: 'Synced',
        isEnabled: true,
        lastSync: '1 hour ago',
        config: { url: 'https://jira.company.com/projects/ADAS', projectKey: 'ADAS' },
        documents: [
          { id: 'doc-2-1', name: 'ADAS Requirements (All)', type: 'Issue Query', size: '142 Issues', lastModified: 'Today', parsingStatus: 'Unparsed', isEnabled: true }
        ]
      },
      {
        id: 'ds-3',
        name: 'System_Architecture_Spec_v2.docx',
        type: 'Local',
        status: 'Synced',
        isEnabled: true,
        lastSync: '2 hours ago',
        config: { fileName: 'System_Architecture_Spec_v2.docx' },
        documents: [
          { id: 'doc-3-1', name: 'System_Architecture_Spec_v2.docx', type: 'Word Doc', size: '2.4 MB', lastModified: 'Yesterday', parsingStatus: 'ReviewNeeded', isEnabled: true }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Battery Management Unit (BMS)',
    description: 'Firmware development for high-voltage battery control module conforming to ASIL-D safety requirements.',
    type: 'General',
    members: ['David Kim', 'Eve Johnson'],
    createdAt: '2023-10-02',
    stats: { requirements: 89, tests: 204, bugs: 2, coverage: 92 },
    dataSources: []
  }
];

const ProjectLayout: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const { id } = useParams<{ id: string }>();
  const project = projects.find(p => p.id === id);

  if (!project) return <Navigate to="/" />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar projectId={project.id} projectName={project.name} />
      <main className="flex-1 overflow-hidden relative flex flex-col bg-gray-50">
         <Outlet context={{ project }} />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProjectList projects={projects} setProjects={setProjects} />} />
        
        <Route path="/project/:id" element={<ProjectLayout projects={projects} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ProjectContextConsumer Component={Dashboard} projects={projects} />} />
          <Route path="traceability" element={<Traceability />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="data" element={<ProjectContextConsumer Component={DataSources} projects={projects} setProjects={setProjects} />} />
          <Route path="docs" element={<ProjectContextConsumer Component={Documents} projects={projects} setProjects={setProjects} />} />
          <Route path="review/:sourceId/:docId" element={<ProjectContextConsumer Component={DocumentReview} projects={projects} setProjects={setProjects} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

// Helper to inject project prop and update handler
const ProjectContextConsumer: React.FC<{ 
  Component: React.FC<any>, 
  projects: Project[],
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>
}> = ({ Component, projects, setProjects }) => {
  const { id } = useParams<{ id: string }>();
  const project = projects.find(p => p.id === id);
  
  if (!project) return null;

  const handleUpdateProject = (updatedProject: Project) => {
    if (setProjects) {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  };

  return <Component project={project} onUpdateProject={handleUpdateProject} />;
};

export default App;