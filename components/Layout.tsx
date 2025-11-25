import React, { ReactNode } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  Database, 
  FileText, 
  Network, 
  ChevronLeft,
  X,
  Plus
} from 'lucide-react';

// --- Types ---
interface SidebarProps {
  projectId: string;
  projectName: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// --- Components ---

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ projectId, projectName }) => {
  const navigate = useNavigate();

  const navItems = [
    { to: `/project/${projectId}/dashboard`, icon: LayoutDashboard, label: '仪表盘 (Dashboard)' },
    { to: `/project/${projectId}/ai`, icon: Bot, label: 'AI 助手 (Assistant)' },
    { to: `/project/${projectId}/data`, icon: Database, label: '数据源管理 (Data Sources)' },
    { to: `/project/${projectId}/docs`, icon: FileText, label: '文档管理 (Documents)' },
    { to: `/project/${projectId}/traceability`, icon: Network, label: '追溯关系构建 (Traceability)' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-700">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-xs text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft size={14} className="mr-1" /> Back to Projects
        </button>
        <h1 className="text-xl font-bold truncate" title={projectName}>{projectName}</h1>
        <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-semibold">AutoTrace Pro</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-900/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} className="mr-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            U
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs text-slate-500">Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};