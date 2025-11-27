import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2, ChevronDown, Check, Book, Briefcase, Pencil } from 'lucide-react';
import { Modal } from '../components/Layout';
import { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const MEMBER_OPTIONS = ['Alice Chen', 'Bob Smith', 'Charlie Wang', 'David Kim', 'Eve Johnson'];

export const ProjectList: React.FC<ProjectListProps> = ({ projects, setProjects }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectType, setNewProjectType] = useState<'General' | 'KnowledgeBase'>('General');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // UI State for custom dropdown
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing project
      setProjects(projects.map(p => 
        p.id === editingId 
          ? {
              ...p,
              name: newProjectName,
              description: newProjectDesc,
              type: newProjectType,
              members: selectedMembers,
            }
          : p
      ));
    } else {
      // Create new project
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName,
        description: newProjectDesc,
        type: newProjectType,
        members: selectedMembers,
        createdAt: new Date().toISOString().split('T')[0],
        stats: {
          requirements: 0,
          tests: 0,
          bugs: 0,
          coverage: 0
        },
        dataSources: []
      };
      setProjects([newProject, ...projects]);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setNewProjectName(project.name);
    setNewProjectDesc(project.description);
    setNewProjectType(project.type);
    setSelectedMembers(project.members);
    setIsModalOpen(true);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const openNewProjectModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectType('General');
    setSelectedMembers([]);
    setIsMemberDropdownOpen(false);
    setEditingId(null);
  };

  const toggleMember = (member: string) => {
    if (selectedMembers.includes(member)) {
      setSelectedMembers(selectedMembers.filter(m => m !== member));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 overflow-y-auto">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-500 mt-1">Manage your automotive software lifecycle projects.</p>
        </div>
        <button 
          onClick={openNewProjectModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl flex items-center shadow-lg shadow-blue-200/50 transition-all active:scale-95 font-medium"
        >
          <Plus size={20} className="mr-2" /> New Project
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => navigate(`/project/${project.id}/dashboard`)}
            className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${project.type === 'KnowledgeBase' ? 'bg-purple-500' : 'bg-primary-500'} transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${project.type === 'KnowledgeBase' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                {project.type === 'KnowledgeBase' ? <Book size={20} /> : <Briefcase size={20} />}
              </div>
              <div className="flex space-x-2 z-10">
                <button 
                  onClick={(e) => handleEditClick(e, project)}
                  className="text-gray-400 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50 transition-colors"
                  title="Edit Project"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mb-2">
               <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${project.type === 'KnowledgeBase' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  {project.type === 'KnowledgeBase' ? 'Knowledge Base' : 'Common Project'}
               </span>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors">{project.name}</h3>
            <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{project.description}</p>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((member, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600" title={member}>
                    {member.charAt(0)}
                  </div>
                ))}
                {project.members.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-400 font-medium">
                <Calendar size={14} className="mr-1" />
                {project.createdAt}
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-xl border-dashed border-2 border-gray-200">
             <p className="text-lg">No projects found. Create one to get started.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Project" : "Create New Project"}
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input 
              type="text" 
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white text-gray-900"
              placeholder="e.g. ADAS Controller V2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
            <div className="relative">
              <select
                value={newProjectType}
                onChange={(e) => setNewProjectType(e.target.value as 'General' | 'KnowledgeBase')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none bg-white text-gray-900"
              >
                <option value="General">普通项目 (General Project)</option>
                <option value="KnowledgeBase">知识库 (Knowledge Base)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              required
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all h-24 resize-none bg-white text-gray-900"
              placeholder="Brief description of the project scope..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Members (Multi-select)</label>
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer flex justify-between items-center hover:border-primary-400 transition-colors"
              >
                <span className={selectedMembers.length === 0 ? "text-gray-400" : "text-gray-800"}>
                  {selectedMembers.length === 0 
                    ? "Select members..." 
                    : `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isMemberDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isMemberDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {MEMBER_OPTIONS.map(member => (
                    <div 
                      key={member}
                      onClick={() => toggleMember(member)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                    >
                      <span className={`text-sm ${selectedMembers.includes(member) ? 'text-primary-700 font-medium' : 'text-gray-600'}`}>
                        {member}
                      </span>
                      {selectedMembers.includes(member) && (
                        <Check size={16} className="text-primary-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedMembers.length > 0 && (
               <div className="flex flex-wrap gap-2 mt-2">
                 {selectedMembers.map(m => (
                   <span key={m} className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-md border border-primary-100 flex items-center">
                     {m}
                     <button onClick={() => toggleMember(m)} className="ml-1 hover:text-primary-900"><div className="w-3 h-3 text-center leading-3">×</div></button>
                   </span>
                 ))}
               </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md transition-all font-medium"
            >
              {editingId ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};