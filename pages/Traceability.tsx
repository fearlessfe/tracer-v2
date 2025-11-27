
import React, { useState } from 'react';
import { Plus, Save, Download, Check, ArrowRight, AlertCircle, FileText, Code, Box, Activity, LayoutGrid, ArrowLeft, Calendar, PieChart, MoreHorizontal, Trash2, Search } from 'lucide-react';
import { Modal } from '../components/Layout';
import { TraceType, TraceNode, TraceLink } from '../types';

// --- Mock Data ---
const INITIAL_NODES: TraceNode[] = [
  // Requirements
  { id: 'REQ-001', label: 'Adaptive Cruise Control', type: TraceType.REQUIREMENT, status: 'Approved' },
  { id: 'REQ-002', label: 'Emergency Braking', type: TraceType.REQUIREMENT, status: 'Approved' },
  { id: 'REQ-003', label: 'Lane Keep Assist', type: TraceType.REQUIREMENT, status: 'Draft' },
  { id: 'REQ-004', label: 'Blind Spot Detection', type: TraceType.REQUIREMENT, status: 'Approved' },
  
  // Architecture/Design (Optimized Descriptions)
  { id: 'ARCH-101', label: 'Module: Radar Sensor Interface', type: TraceType.DESIGN, status: 'Approved' },
  { id: 'ARCH-102', label: 'Module: Brake Actuator Logic', type: TraceType.DESIGN, status: 'Draft' },
  { id: 'ARCH-103', label: 'Module: Camera Processing Unit', type: TraceType.DESIGN, status: 'Approved' },
  { id: 'ARCH-104', label: 'Module: HMI Warning System', type: TraceType.DESIGN, status: 'Approved' },
  
  // Detailed Design / Code
  { id: 'DD-201', label: 'radar_driver.c', type: TraceType.CODE, status: 'Verified' },
  { id: 'DD-202', label: 'brake_controller.cpp', type: TraceType.CODE, status: 'Verified' },
  { id: 'DD-203', label: 'camera_obj_detect.py', type: TraceType.CODE, status: 'Verified' },
  { id: 'DD-204', label: 'hmi_display_manager.ts', type: TraceType.CODE, status: 'Verified' },
  
  // Test Cases (Optimized Descriptions)
  { id: 'TC-301', label: 'Verify: Radar Signal Quality', type: TraceType.TEST, status: 'Verified' },
  { id: 'TC-302', label: 'Verify: Emergency Stop Trigger', type: TraceType.TEST, status: 'Failed' },
  { id: 'TC-303', label: 'Verify: Lane Departure Warning', type: TraceType.TEST, status: 'Verified' },
  { id: 'TC-304', label: 'Verify: Blind Spot LED Activation', type: TraceType.TEST, status: 'Verified' },
];

const INITIAL_LINKS: TraceLink[] = [
  { source: 'REQ-001', target: 'ARCH-101' },
  { source: 'REQ-002', target: 'ARCH-102' },
  { source: 'REQ-003', target: 'ARCH-103' },
  { source: 'ARCH-101', target: 'DD-201' },
  { source: 'ARCH-102', target: 'DD-202' },
  { source: 'DD-201', target: 'TC-301' },
  { source: 'REQ-001', target: 'TC-301' },
  { source: 'REQ-004', target: 'TC-304' },
];

// --- Types for the View ---

interface TraceRecord {
  id: string;
  name: string;
  description: string;
  relationLabel: string;
  sourceType: TraceType;
  targetType: TraceType;
  lastUpdated: string;
  author: string;
  coverage: number;
  status: 'Draft' | 'Verified' | 'In Progress';
}

const AVAILABLE_RELATIONS = [
  { id: 'REQ-TC', label: 'Requirement ↔ Test Case', source: TraceType.REQUIREMENT, target: TraceType.TEST },
  { id: 'REQ-ARCH', label: 'Requirement ↔ Architecture', source: TraceType.REQUIREMENT, target: TraceType.DESIGN },
  { id: 'ARCH-DD', label: 'Architecture ↔ Code/DD', source: TraceType.DESIGN, target: TraceType.CODE },
  { id: 'DD-TC', label: 'Code ↔ Test Case', source: TraceType.CODE, target: TraceType.TEST },
];

const INITIAL_RECORDS: TraceRecord[] = [
  {
    id: 'tr-1',
    name: 'System Requirements Traceability',
    description: 'Validation of system requirements against architectural design modules.',
    relationLabel: 'Requirement ↔ Architecture',
    sourceType: TraceType.REQUIREMENT,
    targetType: TraceType.DESIGN,
    lastUpdated: '2023-10-24',
    author: 'Alice Chen',
    coverage: 100,
    status: 'Verified'
  },
  {
    id: 'tr-2',
    name: 'Safety Critical Validation',
    description: 'Traceability matrix for ASIL-D safety requirements and system validation tests.',
    relationLabel: 'Requirement ↔ Test Case',
    sourceType: TraceType.REQUIREMENT,
    targetType: TraceType.TEST,
    lastUpdated: '2023-10-25',
    author: 'Bob Smith',
    coverage: 85,
    status: 'In Progress'
  },
  {
    id: 'tr-3',
    name: 'Design Implementation Status',
    description: 'Tracking architectural modules to code implementation.',
    relationLabel: 'Architecture ↔ Code/DD',
    sourceType: TraceType.DESIGN,
    targetType: TraceType.CODE,
    lastUpdated: 'Today',
    author: 'Charlie Wang',
    coverage: 50,
    status: 'Draft'
  }
];

export const Traceability: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [records, setRecords] = useState<TraceRecord[]>(INITIAL_RECORDS);
  const [activeRecord, setActiveRecord] = useState<TraceRecord | null>(null);
  
  // Matrix Data State (shared across views logically, but filtered by view)
  const [nodes] = useState<TraceNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<TraceLink[]>(INITIAL_LINKS);
  
  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRelationType, setNewRelationType] = useState(AVAILABLE_RELATIONS[0].id);

  // --- Helpers ---

  const getTypeIcon = (type: TraceType) => {
    switch (type) {
      case TraceType.REQUIREMENT: return <FileText size={14} className="text-blue-500"/>;
      case TraceType.DESIGN: return <Box size={14} className="text-purple-500"/>;
      case TraceType.CODE: return <Code size={14} className="text-emerald-500"/>;
      case TraceType.TEST: return <Activity size={14} className="text-amber-500"/>;
      default: return <LayoutGrid size={14} className="text-gray-500"/>;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Verified': return 'bg-green-100 text-green-700';
      case 'Draft': return 'bg-gray-100 text-gray-600';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // --- Actions ---

  const handleOpenMatrix = (record: TraceRecord) => {
    setActiveRecord(record);
    setUnsavedChanges(false);
    setViewMode('matrix');
  };

  const handleBackToList = () => {
    if (unsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    setViewMode('list');
    setActiveRecord(null);
  };

  const handleToggleLink = (sourceId: string, targetId: string) => {
    setUnsavedChanges(true);
    const exists = links.some(l => l.source === sourceId && l.target === targetId);
    if (exists) {
      setLinks(links.filter(l => !(l.source === sourceId && l.target === targetId)));
    } else {
      setLinks([...links, { source: sourceId, target: targetId }]);
    }
  };

  const handleSaveMatrix = () => {
    setUnsavedChanges(false);
    // Update the "lastUpdated" field of the active record
    if (activeRecord) {
       const updatedRecords = records.map(r => r.id === activeRecord.id ? { ...r, lastUpdated: 'Just now' } : r);
       setRecords(updatedRecords);
    }
    alert("Traceability matrix saved successfully!");
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const relation = AVAILABLE_RELATIONS.find(r => r.id === newRelationType);
    if (!relation) return;

    const newRecord: TraceRecord = {
      id: `tr-${Date.now()}`,
      name: newName,
      description: newDesc || 'No description provided.',
      relationLabel: relation.label,
      sourceType: relation.source,
      targetType: relation.target,
      lastUpdated: 'Just now',
      author: 'Current User',
      coverage: 0,
      status: 'Draft'
    };

    setRecords([newRecord, ...records]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewDesc('');
  };

  const handleDeleteRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this traceability record?')) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  // --- Views ---

  const renderListView = () => (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Traceability Management</h2>
          <p className="text-gray-500 mt-1">Create and manage bidirectional traceability matrices.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 shadow-md flex items-center font-medium transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" /> New Traceability Scope
        </button>
      </div>

      <div className="grid gap-4">
        {records.map(record => (
          <div 
            key={record.id}
            onClick={() => handleOpenMatrix(record)}
            className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                   <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary-600 transition-colors">{record.name}</h3>
                   <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                     {record.status}
                   </span>
                </div>
                <p className="text-gray-500 text-sm mb-3">{record.description}</p>
                <div className="flex items-center text-xs text-gray-400 space-x-4">
                   <div className="flex items-center bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {getTypeIcon(record.sourceType)} 
                      <span className="mx-2 text-gray-300">→</span> 
                      {getTypeIcon(record.targetType)}
                      <span className="ml-2 text-gray-600 font-medium">{record.relationLabel}</span>
                   </div>
                   <div className="flex items-center">
                      <Calendar size={12} className="mr-1"/> {record.lastUpdated}
                   </div>
                   <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold mr-1">
                        {record.author.charAt(0)}
                      </span>
                      {record.author}
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-6 md:border-l border-gray-100 md:pl-6">
                <div className="text-center min-w-[80px]">
                  <div className="text-2xl font-bold text-gray-800">{record.coverage}%</div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Coverage</div>
                </div>
                <button className="p-2 text-primary-600 bg-primary-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-100">
                  <ArrowRight size={20} />
                </button>
                <button 
                  onClick={(e) => handleDeleteRecord(e, record.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <LayoutGrid size={48} className="mx-auto text-gray-300 mb-4"/>
            <h3 className="text-gray-500 font-medium">No traceability records found</h3>
            <p className="text-gray-400 text-sm mt-1">Create a new scope to start linking artifacts.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMatrixView = () => {
    if (!activeRecord) return null;
    return (
      <div className="p-8 h-full flex flex-col animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
             <button onClick={handleBackToList} className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors">
               <ArrowLeft size={20} className="text-gray-600"/>
             </button>
             <div>
               <h2 className="text-xl font-bold text-gray-800">{activeRecord.name}</h2>
               <p className="text-sm text-gray-500 flex items-center mt-1">
                 <span className="font-medium mr-2">{activeRecord.relationLabel}</span>
                 {unsavedChanges && <span className="text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center"><AlertCircle size={10} className="mr-1"/> Unsaved Changes</span>}
               </p>
             </div>
          </div>
          <button 
            onClick={handleSaveMatrix}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 shadow flex items-center font-medium"
          >
            <Save size={18} className="mr-2"/> Save Matrix
          </button>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
           {/* Matrix Header */}
           <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-64 p-4 font-bold text-gray-500 text-sm border-r border-gray-200 bg-gray-50 flex-shrink-0">
                 Source \ Target
              </div>
              <div className="flex-1 flex overflow-x-auto">
                 {nodes.filter(n => n.type === activeRecord.targetType).map(targetNode => (
                    <div key={targetNode.id} className="w-32 p-4 text-xs font-semibold text-gray-600 border-r border-gray-200 flex-shrink-0 text-center truncate" title={targetNode.label}>
                       <div className="font-mono mb-1 text-gray-400">{targetNode.id}</div>
                       {targetNode.label}
                    </div>
                 ))}
              </div>
           </div>
           
           {/* Matrix Body */}
           <div className="flex-1 overflow-y-auto">
              {nodes.filter(n => n.type === activeRecord.sourceType).map(sourceNode => (
                 <div key={sourceNode.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                    <div className="w-64 p-4 text-sm font-medium text-gray-700 border-r border-gray-200 bg-white flex-shrink-0 truncate" title={sourceNode.label}>
                       <div className="font-mono text-xs text-gray-400 mb-1">{sourceNode.id}</div>
                       {sourceNode.label}
                    </div>
                    <div className="flex-1 flex">
                       {nodes.filter(n => n.type === activeRecord.targetType).map(targetNode => {
                          const isLinked = links.some(l => l.source === sourceNode.id && l.target === targetNode.id);
                          return (
                             <div 
                               key={`${sourceNode.id}-${targetNode.id}`} 
                               onClick={() => handleToggleLink(sourceNode.id, targetNode.id)}
                               className={`w-32 border-r border-gray-100 flex items-center justify-center cursor-pointer transition-colors
                                  ${isLinked ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-100'}
                               `}
                             >
                                {isLinked && <Check size={20} className="text-primary-600" />}
                             </div>
                          );
                       })}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden bg-gray-50">
      {viewMode === 'list' ? renderListView() : renderMatrixView()}

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Create Traceability Scope"
      >
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope Name</label>
            <input 
              type="text" 
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. System Requirements Validation"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Traceability Relation</label>
            <select
              value={newRelationType}
              onChange={(e) => setNewRelationType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              {AVAILABLE_RELATIONS.map(rel => (
                <option key={rel.id} value={rel.id}>{rel.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
              placeholder="Describe the purpose of this matrix..."
            />
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md transition-all font-medium"
            >
              Create Scope
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
