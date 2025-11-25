
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
      default: return <LayoutGrid size={14} className="text-slate-500"/>;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Verified': return 'bg-green-100 text-green-700';
      case 'Draft': return 'bg-slate-100 text-slate-600';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
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
          <h2 className="text-2xl font-bold text-slate-800">Traceability Management</h2>
          <p className="text-slate-500 mt-1">Create and manage bidirectional traceability matrices.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 shadow-lg shadow-blue-100 flex items-center font-medium transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" /> New Traceability Scope
        </button>
      </div>

      <div className="grid gap-4">
        {records.map(record => (
          <div 
            key={record.id}
            onClick={() => handleOpenMatrix(record)}
            className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                   <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{record.name}</h3>
                   <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                     {record.status}
                   </span>
                </div>
                <p className="text-slate-500 text-sm mb-3">{record.description}</p>
                <div className="flex items-center text-xs text-slate-400 space-x-4">
                   <div className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {getTypeIcon(record.sourceType)} 
                      <span className="mx-2 text-slate-300">→</span> 
                      {getTypeIcon(record.targetType)}
                      <span className="ml-2 text-slate-600 font-medium">{record.relationLabel}</span>
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

              <div className="flex items-center gap-6 md:border-l border-slate-100 md:pl-6">
                <div className="text-center min-w-[80px]">
                  <div className="text-2xl font-bold text-slate-800">{record.coverage}%</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Coverage</div>
                </div>
                <button className="p-2 text-primary-600 bg-primary-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-100">
                  <ArrowRight size={20} />
                </button>
                <button 
                  onClick={(e) => handleDeleteRecord(e, record.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            <LayoutGrid size={48} className="mx-auto text-slate-300 mb-4"/>
            <h3 className="text-slate-500 font-medium">No traceability records found</h3>
            <p className="text-slate-400 text-sm mt-1">Create a new scope to start linking artifacts.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMatrixView = () => {
    if (!activeRecord) return null;
    
    const rowNodes = nodes.filter(n => n.type === activeRecord.sourceType);
    const colNodes = nodes.filter(n => n.type === activeRecord.targetType);

    return (
      <div className="h-full flex flex-col bg-slate-50 animate-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-20">
          <div className="flex items-center">
            <button 
              onClick={handleBackToList}
              className="mr-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                {activeRecord.name}
              </h2>
              <div className="flex items-center text-xs text-slate-500 mt-0.5">
                 <span className="bg-slate-100 px-1.5 rounded mr-2 text-slate-600">{activeRecord.relationLabel}</span>
                 <span>Last saved: {activeRecord.lastUpdated}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {unsavedChanges && (
               <span className="text-amber-600 text-sm font-medium flex items-center bg-amber-50 px-3 py-1 rounded-full animate-pulse">
                 <AlertCircle size={14} className="mr-2"/> Unsaved Changes
               </span>
            )}
            <button 
              onClick={handleSaveMatrix}
              disabled={!unsavedChanges}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                unsavedChanges 
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save size={18} className="mr-2"/> Save Matrix
            </button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Export">
               <Download size={20}/>
            </button>
          </div>
        </div>

        {/* Matrix Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden inline-block min-w-full">
            <div className="relative">
              <table className="border-collapse text-sm">
                <thead>
                  <tr>
                    {/* Top-Left Corner */}
                    <th className="bg-slate-50 p-4 border-b border-r border-slate-200 min-w-[280px] text-left align-bottom z-20 sticky top-0 left-0 shadow-[1px_1px_5px_rgba(0,0,0,0.05)]">
                       <div className="flex flex-col space-y-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">Source ({activeRecord.sourceType})</span>
                          <div className="flex items-center text-slate-700 font-semibold p-2 bg-white rounded border border-slate-200 shadow-sm">
                             {getTypeIcon(activeRecord.sourceType)}
                             <span className="ml-2">{activeRecord.sourceType} Items</span>
                             <span className="ml-auto bg-slate-100 px-1.5 rounded text-xs text-slate-500">{rowNodes.length}</span>
                          </div>
                       </div>
                    </th>

                    {/* Column Headers */}
                    {colNodes.map(col => (
                      <th key={col.id} className="bg-slate-50 p-2 border-b border-slate-200 min-w-[100px] h-[180px] align-bottom z-10 sticky top-0">
                        <div className="h-full flex flex-col justify-end items-center pb-2 relative group">
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-slate-300"></div>
                          <div className="writing-vertical-rl transform rotate-180 text-left font-medium text-slate-600 hover:text-primary-600 transition-colors truncate max-h-[140px] w-6">
                             {col.label}
                          </div>
                          <div className="mt-2 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400">
                            {col.id}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowNodes.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                      {/* Row Header */}
                      <td className="p-4 border-r border-b border-slate-100 bg-white group-hover:bg-slate-50 z-10 sticky left-0 shadow-[1px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-1">
                             <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded border border-slate-200">{row.id}</span>
                             <span className={`w-2 h-2 rounded-full ${row.status === 'Verified' ? 'bg-green-500' : row.status === 'Approved' ? 'bg-blue-500' : 'bg-slate-300'}`} title={row.status}></span>
                          </div>
                          <span className="font-medium text-slate-700 text-sm truncate max-w-[240px]" title={row.label}>{row.label}</span>
                        </div>
                      </td>

                      {/* Cells */}
                      {colNodes.map(col => {
                        const linked = links.some(l => l.source === row.id && l.target === col.id);
                        return (
                          <td 
                            key={`${row.id}-${col.id}`} 
                            onClick={() => handleToggleLink(row.id, col.id)}
                            className={`border-b border-slate-100 border-r border-slate-50 p-0 cursor-pointer transition-all relative text-center h-16
                              ${linked ? 'bg-primary-50/40' : 'hover:bg-slate-100'}
                            `}
                          >
                            <div className="w-full h-full flex items-center justify-center">
                              {linked ? (
                                <div className="w-6 h-6 bg-primary-600 rounded shadow-sm flex items-center justify-center transform transition-transform scale-100 hover:scale-110 hover:bg-primary-700">
                                  <Check size={14} className="text-white" strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors"></div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {rowNodes.length === 0 && (
                     <tr><td colSpan={colNodes.length + 1} className="p-8 text-center text-slate-400">No source items available for this view.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-50">
      {viewMode === 'list' ? renderListView() : renderMatrixView()}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Traceability Scope">
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scope Name</label>
            <input 
              type="text" 
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Requirements Validation Matrix"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-20"
              placeholder="Purpose of this traceability view..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Relationship Type</label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {AVAILABLE_RELATIONS.map(rel => (
                <label 
                  key={rel.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    newRelationType === rel.id 
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                      : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="relationType"
                    value={rel.id}
                    checked={newRelationType === rel.id}
                    onChange={(e) => setNewRelationType(e.target.value)}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div className="ml-3 flex-1">
                     <span className="block text-sm font-medium text-slate-800">{rel.label}</span>
                     <div className="flex items-center text-xs text-slate-500 mt-1 gap-1">
                        <span className="bg-white border px-1.5 py-0.5 rounded">{rel.source}</span>
                        <ArrowRight size={10}/>
                        <span className="bg-white border px-1.5 py-0.5 rounded">{rel.target}</span>
                     </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-2">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)} 
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md font-medium"
            >
              Create Scope
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
