
import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, FileText, Download, ExternalLink, Trash2, Github, Globe, HardDrive, 
  Plus, RefreshCw, ToggleLeft, ToggleRight, ChevronRight, ChevronDown, FileCode, Folder, ArrowLeft, CheckCircle2,
  Lock, User, Key, AtSign, Search, Loader2, Play, Eye, Image as ImageIcon, Save, Edit2, ChevronUp, LayoutTemplate, Filter, MousePointerClick, X, FolderOpen, List
} from 'lucide-react';
import { Project, DataSource, DataSourceType, ParsingStatus, DocumentArtifact } from '../types';
import { Modal } from '../components/Layout';

// --- Mock Data for Git Tree ---
const MOCK_GIT_TREE = {
  name: 'root',
  type: 'folder',
  children: [
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'main.c', type: 'file', content: '#include <stdio.h>\n#include "radar.h"\n\nint main() {\n  init_radar();\n  while(1) {\n    process_signals();\n  }\n  return 0;\n}' },
        { name: 'radar.c', type: 'file', content: '#include "radar.h"\n\nvoid init_radar() {\n  // Hardware init\n}\n\nvoid process_signals() {\n  // FFT processing\n}' },
        { name: 'radar.h', type: 'file', content: '#ifndef RADAR_H\n#define RADAR_H\n\nvoid init_radar();\nvoid process_signals();\n\n#endif' },
      ]
    },
    {
      name: 'tests',
      type: 'folder',
      children: [
        { name: 'test_radar.c', type: 'file', content: 'void test_init() {\n  assert(radar_status == OK);\n}' }
      ]
    },
    { name: 'README.md', type: 'file', content: '# ADAS Core\n\nCore control logic for ADAS system.' }
  ]
};

const MOCK_JIRA_PROJECTS = [
  { key: 'ADAS', name: 'ADAS Platform (ADAS)' },
  { key: 'INF', name: 'Infotainment System (INF)' },
  { key: 'BATT', name: 'Battery Control (BATT)' },
  { key: 'PLAT', name: 'Platform Core (PLAT)' },
];

// --- Components ---

const FileTreeNode = ({ node, onSelect, depth = 0 }: { node: any, onSelect: (node: any) => void, depth?: number }) => {
  const [isOpen, setIsOpen] = useState(depth === 0); // Open root by default
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer ${depth === 0 ? 'hidden' : ''}`} 
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={handleToggle}
      >
        {node.type === 'folder' && (
          <span className="mr-1 text-gray-400">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        <span className={`mr-2 ${node.type === 'folder' ? 'text-blue-400' : 'text-gray-500'}`}>
          {node.type === 'folder' ? <Folder size={16} /> : <FileCode size={16} />}
        </span>
        <span className={`text-sm ${node.type === 'file' ? 'text-gray-700' : 'font-medium text-gray-800'}`}>{node.name}</span>
      </div>
      
      {/* Render children if folder is open */}
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child: any, i: number) => (
            <FileTreeNode key={i} node={child} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Detail Views ---

const GitDetailView: React.FC<{ 
  source: DataSource, 
  onBack: () => void,
  onUpdateSource: (ds: DataSource) => void
}> = ({ source, onBack, onUpdateSource }) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'tracked'>('explorer');

  const toggleDoc = (docId: string) => {
     const updatedDocs = source.documents.map(d => 
        d.id === docId ? { ...d, isEnabled: !d.isEnabled } : d
     );
     onUpdateSource({ ...source, documents: updatedDocs });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center mb-4 pb-4 border-b border-gray-200 justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{source.name}</h3>
            <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
              {source.config.url} <span className="bg-gray-100 px-1 rounded text-gray-600">{source.config.branch}</span>
              {source.config.username && <span className="flex items-center text-gray-400"><User size={10} className="mr-1"/> {source.config.username}</span>}
            </p>
          </div>
        </div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
           <button 
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'explorer' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
              <FileCode size={14} className="mr-2"/> Explorer
           </button>
           <button 
              onClick={() => setActiveTab('tracked')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'tracked' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
              <List size={14} className="mr-2"/> Tracked Files ({source.documents.length})
           </button>
        </div>
      </div>
      
      {activeTab === 'explorer' ? (
        <div className="flex-1 flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {/* Sidebar Tree */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto p-2">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Explorer</div>
            <FileTreeNode node={MOCK_GIT_TREE} onSelect={setSelectedFile} />
          </div>

          {/* Code View */}
          <div className="flex-1 bg-white flex flex-col">
            {selectedFile ? (
               <>
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-sm font-mono text-gray-600 flex items-center">
                    <FileCode size={14} className="mr-2"/> {selectedFile.name}
                  </div>
                  <div className="flex-1 p-4 overflow-auto bg-[#1e1e1e] text-gray-300 font-mono text-sm leading-relaxed">
                    <pre>{selectedFile.content}</pre>
                  </div>
               </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <FileCode size={48} className="mb-4 opacity-20" />
                <p>Select a file from the explorer to view its content.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                 <tr>
                    <th className="p-4 font-medium">File Name</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Included in Docs</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {source.documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                       <td className="p-4 font-medium text-gray-700">{doc.name}</td>
                       <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600`}>{doc.parsingStatus}</span>
                       </td>
                       <td className="p-4">
                          <button 
                             onClick={() => toggleDoc(doc.id)}
                             className={`flex items-center space-x-2 transition-colors ${doc.isEnabled ? 'text-primary-600' : 'text-gray-300'}`}
                          >
                             {doc.isEnabled ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                             <span className="text-xs text-gray-500 font-medium">{doc.isEnabled ? 'Enabled' : 'Disabled'}</span>
                          </button>
                       </td>
                    </tr>
                 ))}
                 {source.documents.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">No tracked files found.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

const GenericDetailView: React.FC<{ 
  source: DataSource, 
  onBack: () => void,
  onUpdateSource: (ds: DataSource) => void
}> = ({ source, onBack, onUpdateSource }) => {
  
  const toggleDoc = (docId: string) => {
    const updatedDocs = source.documents.map(d => 
       d.id === docId ? { ...d, isEnabled: !d.isEnabled } : d
    );
    onUpdateSource({ ...source, documents: updatedDocs });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
        <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{source.name}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            {source.type} Data Source Details
            {source.config.projectKey && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">{source.config.projectKey}</span>}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
           <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
             <tr>
               <th className="p-4 font-medium">{source.type === 'Jira' ? 'Issue Key' : 'File Name'}</th>
               <th className="p-4 font-medium">Parsing Status</th>
               <th className="p-4 font-medium">Date</th>
               <th className="p-4 font-medium">Included in Docs</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {source.documents.map(item => (
               <tr key={item.id} className="hover:bg-gray-50">
                 <td className="p-4 font-medium text-gray-700">{item.name}</td>
                 <td className="p-4">
                   <span className={`px-2 py-1 rounded-full text-xs 
                     ${item.parsingStatus === 'Verified' ? 'bg-green-100 text-green-700' : 
                       item.parsingStatus === 'ReviewNeeded' ? 'bg-amber-100 text-amber-700' : 
                       item.parsingStatus === 'Structured' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                     {item.parsingStatus}
                   </span>
                 </td>
                 <td className="p-4 text-gray-500">{item.lastModified || '-'}</td>
                 <td className="p-4">
                    <button 
                       onClick={() => toggleDoc(item.id)}
                       className={`flex items-center space-x-2 transition-colors ${item.isEnabled ? 'text-primary-600' : 'text-gray-300'}`}
                       title={item.isEnabled ? 'Click to Disable' : 'Click to Enable'}
                    >
                       {item.isEnabled ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                       <span className="text-xs text-gray-500 font-medium">{item.isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                 </td>
               </tr>
             ))}
             {source.documents.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">No documents available.</td>
                </tr>
             )}
           </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Document Review Modal (Split View) ---

interface ParsedBlock {
  id: string;
  type: 'text' | 'image' | 'table-row';
  content?: string;
  src?: string;
  description?: string;
  context?: string;
}

const MOCK_PARSED_CONTENT: ParsedBlock[] = [
  { id: 't1', type: 'text', content: '1. Introduction' },
  { id: 't2', type: 'text', content: 'The purpose of this document is to define the system architecture for the ADAS L2+ feature set. The system relies on a fusion of camera and radar sensors.' },
  { 
    id: 'img1', 
    type: 'image', 
    src: 'https://placehold.co/600x300/e2e8f0/64748b?text=System+Block+Diagram', 
    description: 'Figure 1: High-level System Block Diagram showing Sensor fusion unit.',
    context: 'Figure 1 illustrates the high-level data flow.'
  },
  { id: 't3', type: 'text', content: '2. Hardware Interfaces' },
  { id: 't4', type: 'text', content: 'The primary interface between the sensor module and the ECU is via automotive Ethernet. Below is the pinout configuration.' },
  { 
    id: 'img2', 
    type: 'image', 
    src: 'https://placehold.co/400x200/e2e8f0/64748b?text=Pinout+Table+Image', 
    description: 'Table 1: Connector Pinout Configuration (Needs Review)', 
    context: 'Table 1: Connector Pinout'
  },
  { id: 't5', type: 'text', content: '3. Software Components' },
  { id: 't6', type: 'text', content: 'The software stack is composed of the OS abstraction layer, the RTE, and the Application layer.' },
  { 
    id: 'img3', 
    type: 'image', 
    src: 'https://placehold.co/500x400/e2e8f0/64748b?text=Software+Stack', 
    description: 'Figure 2: AUTOSAR Layered Architecture', 
    context: 'As shown in Figure 2, the stack follows standard AUTOSAR methodology.'
  }
];

const ImageReviewModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: () => void;
  docName: string; 
}> = ({ isOpen, onClose, onSave, docName }) => {
  const [blocks, setBlocks] = useState<ParsedBlock[]>(MOCK_PARSED_CONTENT);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  if (!isOpen) return null;

  const images = blocks.filter(b => b.type === 'image');

  const handleScrollTo = (id: string) => {
    setActiveImageId(id);
    const element = document.getElementById(`block-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDescriptionChange = (id: string, newDesc: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, description: newDesc } : b));
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FileText size={20} className="mr-2 text-primary-600"/>
              Review Parse Results: <span className="ml-1 font-normal text-gray-600">{docName}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Verify and edit image descriptions extracted from the document.</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium">Cancel</button>
            <button onClick={onSave} className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-medium flex items-center">
              <Save size={16} className="mr-2"/> Confirm & Save
            </button>
          </div>
        </div>

        {/* Body - Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar - Image List */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Extracted Images ({images.length})</h3>
            <div className="space-y-3">
              {images.map((img, idx) => (
                <div 
                  key={img.id}
                  onClick={() => handleScrollTo(img.id)}
                  className={`group cursor-pointer p-3 rounded-lg border transition-all hover:shadow-md flex gap-3 ${
                    activeImageId === img.id 
                      ? 'bg-white border-primary-500 ring-1 ring-primary-500 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                    <img src={img.src} alt="thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate mb-1">Image {idx + 1}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">{img.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Document Flow */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-8 relative scroll-smooth">
            <div className="max-w-3xl mx-auto bg-white shadow-lg min-h-full p-12 rounded-sm">
              {blocks.map(block => {
                if (block.type === 'text') {
                  return (
                    <div key={block.id} className="mb-6 text-gray-800 leading-relaxed text-justify">
                       {block.content}
                    </div>
                  );
                } else if (block.type === 'image') {
                  return (
                    <div 
                      key={block.id} 
                      id={`block-${block.id}`} 
                      className={`mb-8 scroll-mt-8 p-4 rounded-xl border-2 transition-all ${
                        activeImageId === block.id ? 'border-primary-400 bg-primary-50/30' : 'border-transparent hover:border-gray-200'
                      }`}
                      onClick={() => setActiveImageId(block.id)}
                    >
                      <div className="flex flex-col items-center">
                        <img src={block.src} alt="Extracted" className="max-w-full rounded-lg shadow-sm mb-4 max-h-[400px] object-contain" />
                        
                        <div className="w-full max-w-lg">
                          <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <Edit2 size={12} className="mr-1"/> Image Description (Editable)
                          </label>
                          <textarea 
                            value={block.description}
                            onChange={(e) => handleDescriptionChange(block.id, e.target.value)}
                            className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white shadow-inner"
                            rows={3}
                          />
                          {block.context && (
                            <p className="mt-2 text-xs text-gray-400 italic">
                              Context: "{block.context}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Structure Verification View ---

type StructureType = 'REQ' | 'TC' | 'ARCH' | 'DD';

interface StructuredItem {
  id: string;
  type: StructureType;
  content: string;
  linkedBlockIds: string[];
}

const MOCK_STRUCTURED_ITEMS: StructuredItem[] = [
  { id: 'SYS-ARCH-01', type: 'ARCH', content: 'System relies on a fusion of camera and radar sensors.', linkedBlockIds: ['t2', 'img1'] },
  { id: 'HW-IF-01', type: 'ARCH', content: 'Primary interface is automotive Ethernet.', linkedBlockIds: ['t4', 'img2'] },
];

const StructureVerificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  docName: string;
}> = ({ isOpen, onClose, onSave, docName }) => {
  const [items, setItems] = useState<StructuredItem[]>(MOCK_STRUCTURED_ITEMS);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<StructureType | 'ALL'>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [newItemType, setNewItemType] = useState<StructureType>('REQ');
  const [newItemId, setNewItemId] = useState('');

  if (!isOpen) return null;

  const filteredItems = filterType === 'ALL' ? items : items.filter(i => i.type === filterType);

  const handleItemClick = (item: StructuredItem) => {
    setActiveItemId(item.id);
    // Scroll to first linked block
    if (item.linkedBlockIds.length > 0) {
      const el = document.getElementById(`struct-block-${item.linkedBlockIds[0]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleBlockClick = (blockId: string) => {
    if (selectedBlockIds.includes(blockId)) {
      setSelectedBlockIds(selectedBlockIds.filter(id => id !== blockId));
    } else {
      setSelectedBlockIds([...selectedBlockIds, blockId]);
    }
  };

  const handleCreateItem = () => {
    if (selectedBlockIds.length === 0) return;
    // Extract content from blocks (simplified)
    const content = selectedBlockIds
      .map(id => MOCK_PARSED_CONTENT.find(b => b.id === id)?.content || '[Image]')
      .join(' ');
    
    const newItem: StructuredItem = {
      id: newItemId || `NEW-${Date.now()}`,
      type: newItemType,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      linkedBlockIds: [...selectedBlockIds]
    };

    setItems([...items, newItem]);
    setSelectedBlockIds([]);
    setIsCreating(false);
    setNewItemId('');
    setActiveItemId(newItem.id);
  };

  const getBadgeColor = (type: StructureType) => {
    switch(type) {
      case 'REQ': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'TC': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ARCH': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'DD': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <LayoutTemplate size={20} className="mr-2 text-primary-600"/>
              Structure Verification: <span className="ml-1 font-normal text-gray-600">{docName}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Verify extracted items and link them to source text.</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-xs text-gray-400 mr-4 flex items-center">
                <MousePointerClick size={14} className="mr-1"/> Select blocks on right to create new items
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <X size={20} className="text-gray-500"/>
             </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Structured Items */}
          <div className="w-[400px] bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
               <div className="flex items-center text-sm font-medium text-gray-600">
                 <Filter size={16} className="mr-2"/> Filter:
               </div>
               <select 
                 value={filterType} 
                 onChange={(e) => setFilterType(e.target.value as any)}
                 className="text-sm border-gray-300 rounded-md border px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
               >
                 <option value="ALL">All Types</option>
                 <option value="REQ">Requirements</option>
                 <option value="ARCH">Architecture</option>
                 <option value="DD">Detailed Design</option>
                 <option value="TC">Test Cases</option>
               </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${
                    activeItemId === item.id 
                      ? 'bg-white border-primary-500 shadow-md ring-1 ring-primary-500' 
                      : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-gray-700">{item.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getBadgeColor(item.type)}`}>
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{item.content}</p>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">No items found.</div>
              )}
            </div>

            {/* Creation Toolbar (visible when blocks selected) */}
            {selectedBlockIds.length > 0 && (
               <div className="p-4 border-t border-gray-200 bg-primary-50 animate-in slide-in-from-bottom-2">
                  {!isCreating ? (
                    <button 
                      onClick={() => setIsCreating(true)}
                      className="w-full py-2 bg-primary-600 text-white rounded-lg shadow font-medium hover:bg-primary-700 transition-colors flex justify-center items-center"
                    >
                      <Plus size={16} className="mr-2"/> Create Item from {selectedBlockIds.length} Selection
                    </button>
                  ) : (
                    <div className="space-y-3">
                       <div className="flex gap-2">
                          <select 
                             value={newItemType}
                             onChange={(e) => setNewItemType(e.target.value as StructureType)}
                             className="flex-1 text-sm rounded border-gray-300 p-2"
                          >
                             <option value="REQ">REQ</option>
                             <option value="ARCH">ARCH</option>
                             <option value="DD">DD</option>
                             <option value="TC">TC</option>
                          </select>
                          <input 
                             type="text" 
                             placeholder="ID (Optional)" 
                             value={newItemId} 
                             onChange={(e) => setNewItemId(e.target.value)}
                             className="flex-1 text-sm rounded border-gray-300 p-2"
                          />
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setIsCreating(false)} className="flex-1 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                          <button onClick={handleCreateItem} className="flex-1 py-1.5 text-sm text-white bg-primary-600 rounded hover:bg-primary-700 shadow-sm">Confirm</button>
                       </div>
                    </div>
                  )}
               </div>
            )}
          </div>

          {/* Right Panel: Document Content */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-8 relative scroll-smooth">
             <div className="max-w-3xl mx-auto bg-white shadow-lg min-h-full p-12 rounded-sm relative">
                {MOCK_PARSED_CONTENT.map(block => {
                   const isLinked = activeItemId ? items.find(i => i.id === activeItemId)?.linkedBlockIds.includes(block.id) : false;
                   const isSelected = selectedBlockIds.includes(block.id);

                   return (
                      <div 
                        key={block.id}
                        id={`struct-block-${block.id}`}
                        onClick={() => handleBlockClick(block.id)}
                        className={`transition-all duration-300 rounded px-2 -mx-2 cursor-pointer border-2
                           ${isSelected ? 'bg-primary-100/50 border-primary-400' : 
                             isLinked ? 'bg-yellow-100/50 border-yellow-400 scale-[1.01] shadow-sm' : 'border-transparent hover:bg-gray-50'}
                        `}
                      >
                        {block.type === 'text' ? (
                           <p className="mb-4 text-gray-800 leading-relaxed text-justify pointer-events-none">{block.content}</p>
                        ) : (
                           <div className="mb-6 flex justify-center pointer-events-none">
                              <img src={block.src} className="max-h-[200px] rounded border border-gray-200" alt="content"/>
                           </div>
                        )}
                      </div>
                   );
                })}
             </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
           <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
           <button onClick={onSave} className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg shadow font-medium flex items-center">
             <CheckCircle2 size={18} className="mr-2"/> Complete Verification
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Main DataSources Component ---

interface DataSourcesProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const DataSources: React.FC<DataSourcesProps> = ({ project, onUpdateProject }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  
  // Form State
  const [newSourceType, setNewSourceType] = useState<DataSourceType>('Local');
  const [newSourceName, setNewSourceName] = useState('');
  
  // Git State
  const [newSourceUrl, setNewSourceUrl] = useState(''); 
  const [newSourceBranch, setNewSourceBranch] = useState('main'); 
  const [gitUsername, setGitUsername] = useState('');
  const [gitToken, setGitToken] = useState('');

  // Jira State
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [jiraProjects, setJiraProjects] = useState<{key: string, name: string}[]>([]);
  const [selectedJiraProject, setSelectedJiraProject] = useState('');
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [isConnectingJira, setIsConnectingJira] = useState(false);
  
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config: any = {};
    let initialDocs: DocumentArtifact[] = [];

    if (newSourceType === 'Local') {
      const fileName = `upload_${Date.now()}.docx`;
      config.fileName = fileName;
      initialDocs = [
        { id: `d-${Date.now()}`, name: fileName, type: 'File', parsingStatus: 'Unparsed', size: '2.1 MB', lastModified: 'Just now', isEnabled: true }
      ];
    } else if (newSourceType === 'Git') {
      config.url = newSourceUrl;
      config.branch = newSourceBranch;
      config.username = gitUsername;
      config.token = gitToken ? '******' : undefined;
      // Mock discovered docs
      initialDocs = [
        { id: `d-${Date.now()}-1`, name: 'README.md', type: 'Markdown', parsingStatus: 'Unparsed', size: '2KB', isEnabled: true },
        { id: `d-${Date.now()}-2`, name: 'docs/design_spec.pdf', type: 'PDF', parsingStatus: 'Unparsed', size: '1.2MB', isEnabled: true }
      ];
    } else if (newSourceType === 'Jira') {
      config.url = newSourceUrl;
      config.email = jiraEmail;
      config.token = '******';
      config.projectKey = selectedJiraProject;
      // Mock Jira Doc
      initialDocs = [
        { id: `d-${Date.now()}`, name: `Jira Issues (${selectedJiraProject})`, type: 'Issue Set', parsingStatus: 'Unparsed', size: 'N/A', isEnabled: true }
      ];
    }

    const newSource: DataSource = {
      id: `ds-${Date.now()}`,
      name: newSourceName,
      type: newSourceType,
      status: 'Syncing',
      isEnabled: true,
      lastSync: 'Syncing...',
      config: config,
      documents: initialDocs
    };

    const updatedProject = {
      ...project,
      dataSources: [...project.dataSources, newSource]
    };
    
    onUpdateProject(updatedProject);
    setIsAddModalOpen(false);
    resetForm();

    // Simulate Sync Completion
    setTimeout(() => {
      const syncedProject = {
        ...updatedProject,
        dataSources: updatedProject.dataSources.map(ds => 
          ds.id === newSource.id 
            ? { ...ds, status: 'Synced', lastSync: 'Just now' } as DataSource 
            : ds
        )
      };
      onUpdateProject(syncedProject);
    }, 3000);
  };

  const handleConnectJira = async () => {
    if (!newSourceUrl || !jiraEmail || !jiraToken) {
      alert('Please fill in URL, Email, and Token.');
      return;
    }
    
    setIsConnectingJira(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setJiraProjects(MOCK_JIRA_PROJECTS);
    setIsJiraConnected(true);
    setIsConnectingJira(false);
  };

  const resetForm = () => {
    setNewSourceName('');
    setNewSourceType('Local');
    setNewSourceUrl('');
    setNewSourceBranch('main');
    setGitUsername('');
    setGitToken('');
    setJiraEmail('');
    setJiraToken('');
    setJiraProjects([]);
    setSelectedJiraProject('');
    setIsJiraConnected(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this data source?')) {
      const updatedProject = {
        ...project,
        dataSources: project.dataSources.filter(ds => ds.id !== id)
      };
      onUpdateProject(updatedProject);
      if (selectedSourceId === id) setSelectedSourceId(null);
    }
  };

  const handleToggleEnabled = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedProject = {
      ...project,
      dataSources: project.dataSources.map(ds => 
        ds.id === id ? { ...ds, isEnabled: !ds.isEnabled } : ds
      )
    };
    onUpdateProject(updatedProject);
  };

  const handleRowClick = (ds: DataSource) => {
    if (ds.status === 'Synced') {
      setSelectedSourceId(ds.id);
    }
  };

  const handleUpdateSource = (updatedSource: DataSource) => {
     const updatedProject = {
       ...project,
       dataSources: project.dataSources.map(ds => ds.id === updatedSource.id ? updatedSource : ds)
     };
     onUpdateProject(updatedProject);
  };

  // --- Render Logic ---

  const selectedSource = project.dataSources.find(ds => ds.id === selectedSourceId);

  if (selectedSource) {
    return selectedSource.type === 'Git' 
      ? <GitDetailView source={selectedSource} onBack={() => setSelectedSourceId(null)} onUpdateSource={handleUpdateSource} /> 
      : <GenericDetailView source={selectedSource} onBack={() => setSelectedSourceId(null)} onUpdateSource={handleUpdateSource} />;
  }

  const isAddButtonDisabled = () => {
    if (!newSourceName) return true;
    if (newSourceType === 'Git') {
      return !newSourceUrl || !newSourceBranch;
    }
    if (newSourceType === 'Jira') {
      return !isJiraConnected || !selectedJiraProject;
    }
    return false;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Data Source Management</h2>
           <p className="text-gray-500">Integrate and sync data from external tools (Git, Jira, Local Files).</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 shadow-md flex items-center font-medium transition-transform active:scale-95"
        >
          <Plus size={18} className="mr-2" /> Add Source
        </button>
      </div>

      <div className="grid gap-4">
        {project.dataSources.length === 0 ? (
           <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50">
              <Database size={48} className="mx-auto mb-4 opacity-20"/>
              <p>No data sources configured.</p>
           </div>
        ) : (
          project.dataSources.map(s => (
            <div 
              key={s.id} 
              onClick={() => handleRowClick(s)}
              className={`bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all
                ${s.status === 'Synced' ? 'cursor-pointer hover:border-primary-300 hover:shadow-md' : 'opacity-80 cursor-not-allowed'}
                ${!s.isEnabled ? 'grayscale bg-gray-50' : ''}
              `}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${s.type === 'Git' ? 'bg-gray-100 text-gray-800' : (s.type === 'Jira' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}`}>
                   {s.type === 'Git' ? <Github size={24} /> : (s.type === 'Jira' ? <Globe size={24}/> : <HardDrive size={24} />)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 flex items-center">
                    {s.name}
                    {!s.isEnabled && <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Disabled</span>}
                    {s.config.projectKey && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">{s.config.projectKey}</span>}
                  </h4>
                  <div className="flex items-center text-xs space-x-3 mt-1">
                    <span className="font-semibold text-gray-500">{s.type}</span>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center">
                       {s.status === 'Syncing' ? (
                         <RefreshCw size={12} className="mr-1 animate-spin text-blue-500"/>
                       ) : (
                         <CheckCircle2 size={12} className="mr-1 text-green-500"/>
                       )}
                       <span className={`${s.status === 'Synced' ? 'text-green-600' : 'text-blue-600'} font-medium`}>
                         {s.status === 'Syncing' ? 'Syncing...' : 'Synced'}
                       </span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400">Last updated: {s.lastSync}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                 {/* Toggle Switch */}
                 <button 
                    onClick={(e) => handleToggleEnabled(e, s.id)}
                    className={`transition-colors ${s.isEnabled ? 'text-primary-600' : 'text-gray-400'}`}
                    title={s.isEnabled ? 'Disable Source' : 'Enable Source'}
                 >
                    {s.isEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                 </button>
                 
                 <button 
                   onClick={(e) => handleDelete(e, s.id)}
                   className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                   title="Delete Source"
                 >
                   <Trash2 size={18}/>
                 </button>
                 
                 {s.status === 'Synced' && (
                   <ChevronRight size={20} className="text-gray-300" />
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); resetForm(); }} 
        title="Add Data Source"
      >
        <form onSubmit={handleAddSource} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Local', 'Git', 'Jira'] as DataSourceType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setNewSourceType(t); resetForm(); setNewSourceType(t); }}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    newSourceType === t 
                      ? 'bg-primary-50 border-primary-500 text-primary-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
            <input 
              type="text" 
              required
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder={newSourceType === 'Git' ? 'e.g. Core Repo' : 'e.g. Requirements Doc'}
            />
          </div>

          {/* --- GIT FORM --- */}
          {newSourceType === 'Git' && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="url" 
                    required
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="https://github.com/user/repo.git"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input 
                  type="text" 
                  required
                  value={newSourceBranch}
                  onChange={(e) => setNewSourceBranch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="main"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      value={gitUsername}
                      onChange={(e) => setGitUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="git-user"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token / Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="password" 
                      value={gitToken}
                      onChange={(e) => setGitToken(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="ghp_..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- JIRA FORM --- */}
          {newSourceType === 'Jira' && (
             <div className="space-y-3 animate-in fade-in">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
                 <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="url" 
                      required
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      disabled={isJiraConnected}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="https://company.atlassian.net"
                    />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="email" 
                        required
                        value={jiraEmail}
                        onChange={(e) => setJiraEmail(e.target.value)}
                        disabled={isJiraConnected}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                        placeholder="user@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="password" 
                        required
                        value={jiraToken}
                        onChange={(e) => setJiraToken(e.target.value)}
                        disabled={isJiraConnected}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                        placeholder="Atlassian Token"
                      />
                    </div>
                  </div>
               </div>

               {!isJiraConnected ? (
                 <button
                    type="button"
                    onClick={handleConnectJira}
                    disabled={isConnectingJira || !newSourceUrl || !jiraEmail || !jiraToken}
                    className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isConnectingJira ? <Loader2 size={18} className="animate-spin mr-2"/> : <Search size={18} className="mr-2"/>}
                    {isConnectingJira ? 'Connecting to Jira...' : 'Verify & Fetch Projects'}
                 </button>
               ) : (
                 <div className="animate-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                       <label className="block text-sm font-medium text-gray-700">Select Jira Project</label>
                       <button type="button" onClick={() => setIsJiraConnected(false)} className="text-xs text-blue-500 hover:underline">Change Credentials</button>
                    </div>
                    <select 
                      required
                      value={selectedJiraProject}
                      onChange={(e) => setSelectedJiraProject(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-primary-300 ring-1 ring-primary-100 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                      <option value="">-- Select a Project --</option>
                      {jiraProjects.map(p => (
                        <option key={p.key} value={p.key}>{p.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                      <CheckCircle2 size={12} className="mr-1"/> Connection established
                    </p>
                 </div>
               )}
             </div>
          )}

          {/* --- LOCAL FORM --- */}
          {newSourceType === 'Local' && (
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
                  <FileText size={32} className="mb-2"/>
                  <span className="text-sm">Click to select a file (Mock)</span>
               </div>
             </div>
          )}

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-4">
            <button 
              type="button" 
              onClick={() => { setIsAddModalOpen(false); resetForm(); }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isAddButtonDisabled()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Source
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

interface DocumentsProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

// --- Git File Browser Modal ---

const GitFilesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  source: DataSource | null;
  onParse: (dsId: string, docId: string) => void;
  onReview: (dsId: string, doc: DocumentArtifact) => void;
  getStatusBadge: (status?: ParsingStatus) => React.ReactNode;
}> = ({ isOpen, onClose, source, onParse, onReview, getStatusBadge }) => {
  if (!isOpen || !source) return null;

  // Filter enabled documents for browser view
  const enabledDocuments = source.documents.filter(d => d.isEnabled);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Files in ${source.name}`}>
      <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
        <table className="w-full text-left">
           <thead className="bg-white border-b border-gray-100 sticky top-0 z-10">
              <tr>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-500">File</th>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                 <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
              {enabledDocuments.map(doc => (
                 <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                       <div className="flex items-center">
                          <FileCode size={14} className="text-gray-400 mr-2"/>
                          <span className="text-sm text-gray-700">{doc.name}</span>
                       </div>
                       <div className="text-[10px] text-gray-400 ml-6">{doc.size}</div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(doc.parsingStatus)}</td>
                    <td className="px-4 py-3 text-right">
                       {doc.parsingStatus === 'Unparsed' ? (
                          <button onClick={() => onParse(source.id, doc.id)} className="text-xs bg-white border px-2 py-1 rounded hover:border-blue-500 hover:text-blue-600 transition-colors">Parse</button>
                       ) : doc.parsingStatus === 'ReviewNeeded' ? (
                          <button onClick={() => onReview(source.id, doc)} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100 transition-colors">Review</button>
                       ) : doc.parsingStatus === 'Parsing' ? (
                          <span className="text-xs text-gray-400 italic">Waiting...</span>
                       ) : (
                          <span className="text-xs text-green-600 flex justify-end items-center"><CheckCircle2 size={12} className="mr-1"/> Done</span>
                       )}
                    </td>
                 </tr>
              ))}
              {enabledDocuments.length === 0 && (
                 <tr><td colSpan={3} className="text-center py-8 text-gray-400">No enabled files found.</td></tr>
              )}
           </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end pt-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Close</button>
      </div>
    </Modal>
  );
}

// --- Main Documents Component ---

export const Documents: React.FC<DocumentsProps> = ({ project, onUpdateProject }) => {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedDocForReview, setSelectedDocForReview] = useState<{ dsId: string, doc: DocumentArtifact } | null>(null);
  
  // Structure State
  const [structureModalOpen, setStructureModalOpen] = useState(false); 
  const [verificationViewOpen, setVerificationViewOpen] = useState(false); 
  const [selectedDocForStructure, setSelectedDocForStructure] = useState<{ dsId: string, doc: DocumentArtifact } | null>(null);

  // Git Browser State
  const [gitFilesModalOpen, setGitFilesModalOpen] = useState(false);
  const [selectedGitSourceId, setSelectedGitSourceId] = useState<string | null>(null);

  // Derived state for Git Modal to ensure it gets updates
  const selectedGitSource = project.dataSources.find(ds => ds.id === selectedGitSourceId) || null;

  const handleParse = (dsId: string, docId: string) => {
    const updatedProject = { ...project };
    updatedProject.dataSources = updatedProject.dataSources.map(ds => {
      if (ds.id === dsId) {
        return {
          ...ds,
          documents: ds.documents.map(doc => 
            doc.id === docId ? { ...doc, parsingStatus: 'Parsing' as ParsingStatus } : doc
          )
        };
      }
      return ds;
    });
    onUpdateProject(updatedProject);

    // Mock Async Parse
    setTimeout(() => {
      const finalProject = { ...project }; // Note: In real app, use functional update to avoid closure staleness
      finalProject.dataSources = finalProject.dataSources.map(ds => {
        if (ds.id === dsId) {
          return {
            ...ds,
            documents: ds.documents.map(doc => 
              doc.id === docId ? { ...doc, parsingStatus: 'ReviewNeeded' as ParsingStatus } : doc
            )
          };
        }
        return ds;
      });
      onUpdateProject(finalProject);
    }, 2000);
  };

  const handleReview = (dsId: string, doc: DocumentArtifact) => {
    setSelectedDocForReview({ dsId, doc });
    setReviewModalOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedDocForReview) return;
    
    const { dsId, doc } = selectedDocForReview;
    const updatedProject = { ...project };
    updatedProject.dataSources = updatedProject.dataSources.map(ds => {
      if (ds.id === dsId) {
        return {
          ...ds,
          documents: ds.documents.map(d => 
            d.id === doc.id ? { ...d, parsingStatus: 'Verified' as ParsingStatus } : d
          )
        };
      }
      return ds;
    });

    onUpdateProject(updatedProject);
    setReviewModalOpen(false);
    setSelectedDocForReview(null);
  };

  const handleStructureClick = () => {
    setStructureModalOpen(true);
  };

  const handleSelectDocForStructure = (dsId: string, doc: DocumentArtifact) => {
    setSelectedDocForStructure({ dsId, doc });
    setStructureModalOpen(false);
    setVerificationViewOpen(true);
  };

  const handleConfirmStructure = () => {
     if(!selectedDocForStructure) return;
     const { dsId, doc } = selectedDocForStructure;

     // Update status to Structured
     const updatedProject = { ...project };
     updatedProject.dataSources = updatedProject.dataSources.map(ds => {
       if (ds.id === dsId) {
         return {
           ...ds,
           documents: ds.documents.map(d => 
             d.id === doc.id ? { ...d, parsingStatus: 'Structured' as ParsingStatus } : d
           )
         };
       }
       return ds;
     });
     onUpdateProject(updatedProject);
     setVerificationViewOpen(false);
     setSelectedDocForStructure(null);
  };

  const handleOpenGitFiles = (dsId: string) => {
     setSelectedGitSourceId(dsId);
     setGitFilesModalOpen(true);
  };

  const getVerifiedDocs = () => {
    const verified: { ds: DataSource, doc: DocumentArtifact }[] = [];
    project.dataSources.forEach(ds => {
      ds.documents.forEach(doc => {
        if (doc.parsingStatus === 'Verified' && doc.isEnabled) {
          verified.push({ ds, doc });
        }
      });
    });
    return verified;
  };

  const getStatusBadge = (status?: ParsingStatus) => {
    switch(status) {
      case 'Verified': return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium flex items-center w-fit gap-1"><CheckCircle2 size={12}/> Verified</span>;
      case 'ReviewNeeded': return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 font-medium flex items-center w-fit gap-1"><Eye size={12}/> Review Needed</span>;
      case 'Parsing': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium flex items-center w-fit gap-1"><Loader2 size={12} className="animate-spin"/> Parsing...</span>;
      case 'Structured': return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium flex items-center w-fit gap-1"><LayoutTemplate size={12}/> Structured</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-medium w-fit">Unparsed</span>;
    }
  };

  const getIcon = (type: DataSourceType) => {
     switch(type) {
        case 'Git': return <Github size={18} className="text-gray-700"/>;
        case 'Jira': return <Globe size={18} className="text-blue-600"/>;
        default: return <FileText size={18} className="text-gray-500"/>;
     }
  };

  // Flatten Data Sources for Unified List, filtering disabled documents
  const flatItems = React.useMemo(() => {
     const items: any[] = [];
     project.dataSources.forEach(ds => {
        if (!ds.isEnabled) return; // Skip if entire source is disabled

        if (ds.type === 'Git') {
           items.push({
              id: ds.id,
              isGit: true,
              name: ds.name,
              sourceName: 'Git Repository',
              type: 'Repository',
              size: `${ds.documents.filter(d => d.isEnabled).length} Enabled Files`,
              status: ds.status,
              original: ds
           });
        } else {
           // Treat others as individual documents
           ds.documents.forEach(doc => {
              if (doc.isEnabled) {
                  items.push({
                     id: doc.id,
                     isGit: false,
                     name: doc.name,
                     sourceName: ds.name,
                     type: doc.type,
                     size: doc.size || '-',
                     status: doc.parsingStatus,
                     dsId: ds.id,
                     original: doc,
                     sourceType: ds.type
                  });
              }
           });
        }
     });
     return items;
  }, [project.dataSources]);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
          <div>
             <h2 className="text-2xl font-bold text-gray-800">Document Management</h2>
             <p className="text-gray-500">Unified view of artifacts from all project data sources.</p>
          </div>
          <button 
            onClick={handleStructureClick}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center font-medium transition-all active:scale-95"
          >
            <LayoutTemplate size={18} className="mr-2" /> Structure Artifacts
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Document / Repository</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {flatItems.map(item => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.isGit ? 'bg-gray-50/50' : ''}`}>
                       <td className="px-6 py-4">
                          <div className="flex items-center">
                             <div className={`p-2 rounded-lg mr-3 ${item.isGit ? 'bg-white border border-gray-200' : 'bg-blue-50 text-blue-600'}`}>
                                {item.isGit ? <Github size={18} /> : (item.sourceType === 'Jira' ? <Globe size={18} /> : <FileText size={18} />)}
                             </div>
                             <div>
                                <span className="font-bold text-gray-700 text-sm block">{item.name}</span>
                                {item.isGit && <span className="text-[10px] text-gray-400 font-mono">{item.original.config.branch} branch</span>}
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-sm text-gray-500">{item.sourceName}</td>
                       <td className="px-6 py-4 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded border text-xs ${item.isGit ? 'bg-white border-gray-300 text-gray-600' : 'bg-gray-100 border-transparent text-gray-500'}`}>
                             {item.type}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{item.size}</td>
                       <td className="px-6 py-4">
                          {item.isGit ? (
                             <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium flex items-center w-fit gap-1">
                                <CheckCircle2 size={12}/> Synced
                             </span>
                          ) : (
                             getStatusBadge(item.status)
                          )}
                       </td>
                       <td className="px-6 py-4 text-right">
                          {item.isGit ? (
                             <button 
                                onClick={() => handleOpenGitFiles(item.id)}
                                className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                             >
                                <FolderOpen size={14} className="mr-1.5 text-gray-400"/> Browse Files
                             </button>
                          ) : (
                             <div className="flex justify-end items-center space-x-2">
                                {item.status === 'Unparsed' ? (
                                  <button 
                                    onClick={() => handleParse(item.dsId, item.id)}
                                    className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all flex items-center"
                                  >
                                    <Play size={12} className="mr-1"/> Parse
                                  </button>
                                ) : item.status === 'ReviewNeeded' ? (
                                  <button 
                                    onClick={() => handleReview(item.dsId, item.original)}
                                    className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium transition-all flex items-center shadow-sm"
                                  >
                                    <Eye size={12} className="mr-1"/> Review
                                  </button>
                                ) : item.status === 'Parsing' ? (
                                  <span className="text-xs text-gray-400 italic">Processing...</span>
                                ) : (
                                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View Details">
                                    <ExternalLink size={16} />
                                  </button>
                                )}
                             </div>
                          )}
                       </td>
                    </tr>
                 ))}
                 {flatItems.length === 0 && (
                    <tr>
                       <td colSpan={6} className="py-12 text-center text-gray-400">
                          <Database size={48} className="mx-auto mb-4 opacity-20"/>
                          <p>No documents found. Add a data source to get started.</p>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      <ImageReviewModal 
        isOpen={reviewModalOpen} 
        onClose={() => setReviewModalOpen(false)} 
        onSave={handleConfirmReview}
        docName={selectedDocForReview?.doc.name || 'Document'}
      />

      {/* Selection Modal for Structuring */}
      <Modal 
        isOpen={structureModalOpen} 
        onClose={() => setStructureModalOpen(false)}
        title="Select Document to Structure"
      >
         <div className="space-y-4">
            <p className="text-sm text-gray-600">Only documents with <span className="font-bold text-green-600">Verified</span> parse results can be structured into Requirements, Architecture, or Test Cases.</p>
            <div className="max-h-60 overflow-y-auto border rounded-lg border-gray-200">
               {getVerifiedDocs().length === 0 ? (
                 <div className="p-8 text-center text-gray-400 text-sm">
                    No verified documents available. Please parse and review a document first.
                 </div>
               ) : (
                 getVerifiedDocs().map(({ds, doc}) => (
                    <div 
                      key={doc.id} 
                      onClick={() => handleSelectDocForStructure(ds.id, doc)}
                      className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer flex justify-between items-center group"
                    >
                       <div className="flex items-center">
                          <FileText size={16} className="text-gray-400 mr-3 group-hover:text-purple-500"/>
                          <div>
                             <div className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{doc.name}</div>
                             <div className="text-xs text-gray-400">{ds.name}</div>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-500"/>
                    </div>
                 ))
               )}
            </div>
         </div>
      </Modal>

      <StructureVerificationModal 
         isOpen={verificationViewOpen}
         onClose={() => setVerificationViewOpen(false)}
         onSave={handleConfirmStructure}
         docName={selectedDocForStructure?.doc.name || 'Document'}
      />

      <GitFilesModal 
         isOpen={gitFilesModalOpen}
         onClose={() => setGitFilesModalOpen(false)}
         source={selectedGitSource}
         onParse={handleParse}
         onReview={handleReview}
         getStatusBadge={getStatusBadge}
      />

    </div>
  );
};
