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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
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
    <aside className="w-64 bg-white text-gray-700 flex flex-col h-full border-r border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-xs text-gray-500 hover:text-primary-600 mb-4 transition-colors font-medium"
        >
          <ChevronLeft size={14} className="mr-1" /> Back to Projects
        </button>
        <h1 className="text-lg font-bold truncate text-gray-900" title={projectName}>{projectName}</h1>
        <p className="text-xs text-primary-600 mt-1 uppercase tracking-wider font-bold">AutoTrace Pro</p>
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
                      ? 'bg-blue-50 text-primary-700 font-semibold shadow-sm ring-1 ring-blue-100' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={20} className={`mr-3 transition-transform ${({isActive}: any) => isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-xs font-bold text-primary-600">
            U
          </div>
          <div className="ml-3">
            <p className="text-sm font-semibold text-gray-800">Demo User</p>
            <p className="text-xs text-gray-500">Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};