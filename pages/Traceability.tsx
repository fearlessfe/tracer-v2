
import React, { useState, useEffect } from 'react';
import { Plus, Save, ArrowRight, AlertCircle, FileText, Code, Box, Activity, LayoutGrid, ArrowLeft, Calendar, Trash2, Github, Globe, Link2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Layout';
import { TraceType, TraceNode, TraceLink, Project, DocumentArtifact, SchemaLinkItem, SchemaLinkResponse } from '../types';

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
  status: string;
}

const AVAILABLE_RELATIONS = [
  { id: 'REQ-TC', label: 'Requirement ↔ Test Case', source: TraceType.REQUIREMENT, target: TraceType.TEST },
  { id: 'REQ-ARCH', label: 'Requirement ↔ Architecture', source: TraceType.REQUIREMENT, target: TraceType.DESIGN },
  { id: 'ARCH-DD', label: 'Architecture ↔ Code/DD', source: TraceType.DESIGN, target: TraceType.CODE },
  { id: 'DD-TC', label: 'Code ↔ Test Case', source: TraceType.CODE, target: TraceType.TEST },
];

interface TraceabilityProps {
  project: Project;
  onUpdateProject: (p: Project) => void;
}

// Mock API Response Data
const MOCK_API_RESPONSE: SchemaLinkResponse = {
  "success": true,
  "message": "ok",
  "code": 200,
  "data": [
    {
      "relation_type": "verifies",
      "description": "需求验证关系，表示测试用例验证需求",
      // "0": { ... } // Ignored
      "id": "9e3ddf0-faa55da-b34e-4170faab6f",
      "status": "active",
      "created_at": "2025-11-30T22:40:43.176740+08:00",
      "updated_at": "2025-11-30T22:40:43.176740+08:00",
      "source_schema": {
        "id": "6b2980b-1a37-4694-617d-420760319adb",
        "name": "requirement",
        "description": "需求"
      },
      "target_schema": {
        "id": "7a0516c-e712-4969-6587-1db45684775b",
        "name": "test_case",
        "description": "测试用例"
      }
    },
    // Adding a second mock item to demonstrate list capability
    {
      "relation_type": "implements",
      "description": "设计实现关系，表示架构设计实现需求",
      "id": "8f2cc-123-abc",
      "status": "active",
      "created_at": "2025-11-30T22:45:00.000000+08:00",
      "updated_at": "2025-11-30T22:45:00.000000+08:00",
      "source_schema": {
        "id": "req-id",
        "name": "requirement",
        "description": "需求"
      },
      "target_schema": {
        "id": "arch-id",
        "name": "architecture",
        "description": "架构"
      }
    }
  ]
};

export const Traceability: React.FC<TraceabilityProps> = ({ project }) => {
  // State
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [schemaLinks, setSchemaLinks] = useState<SchemaLinkItem[]>([]);
  const [activeRecord, setActiveRecord] = useState<TraceRecord | null>(null);
  
  // Matrix Data State
  const [nodes] = useState<TraceNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<TraceLink[]>(INITIAL_LINKS);
  
  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- API Fetch Simulation ---
  useEffect(() => {
    const fetchSchemaLinks = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Use Mock Data representing /api/v1/schema/schema-link/list
        const response = MOCK_API_RESPONSE;
        
        if (response.success) {
          setSchemaLinks(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch schema links", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchemaLinks();
  }, []);

  // --- Helpers ---

  // Map API schema names to frontend TraceType enum
  const mapSchemaToTraceType = (schemaName: string): TraceType => {
    const lower = schemaName.toLowerCase();
    if (lower.includes('req')) return TraceType.REQUIREMENT;
    if (lower.includes('arch')) return TraceType.DESIGN;
    if (lower.includes('code') || lower.includes('design')) return TraceType.CODE;
    if (lower.includes('test')) return TraceType.TEST;
    return TraceType.REQUIREMENT; // Default fallback
  };

  const mapApiItemToRecord = (item: SchemaLinkItem): TraceRecord => {
     return {
        id: item.id,
        name: item.relation_type,
        description: item.description,
        relationLabel: `${item.source_schema.name} → ${item.target_schema.name}`,
        sourceType: mapSchemaToTraceType(item.source_schema.name),
        targetType: mapSchemaToTraceType(item.target_schema.name),
        lastUpdated: new Date(item.updated_at).toLocaleDateString(),
        author: 'System',
        coverage: Math.floor(Math.random() * 40) + 60, // Mock coverage
        status: item.status
     };
  };

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
    switch(status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'verified': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'in progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // --- Actions ---

  const handleOpenMatrix = (item: SchemaLinkItem) => {
    // Convert API item to TraceRecord for the Matrix View
    const record = mapApiItemToRecord(item);
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
    alert("Traceability matrix saved successfully!");
  };

  const handleConfirmCreation = async () => {
    try {
      await fetch('/api/v1/trace-links/edge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: project.id
        })
      });
      // In a real app we might verify response here, 
      // but for this request we just ensure the interface is called.
    } catch (e) {
      console.error("API Error", e);
    } finally {
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this traceability record?')) {
      setSchemaLinks(schemaLinks.filter(r => r.id !== id));
    }
  };

  // Flatten documents for selection
  const availableDocs = React.useMemo(() => {
    return project.dataSources.flatMap(ds => 
      ds.documents.map(doc => ({ ...doc, sourceName: ds.name, sourceType: ds.type }))
    ).filter(d => d.isEnabled);
  }, [project]);

  // --- Views ---

  const renderListView = () => (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Traceability Management</h2>
          <p className="text-gray-500 mt-1">Manage traceability schemas and relations.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 shadow-md flex items-center font-medium transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" /> New Traceability Scope
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            Loading schema links...
          </div>
        ) : (
          schemaLinks.map(item => (
            <div 
              key={item.id}
              onClick={() => handleOpenMatrix(item)}
              className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                     <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary-600 transition-colors uppercase tracking-wide">
                        {item.relation_type}
                     </h3>
                     <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                       {item.status}
                     </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4">{item.description}</p>
                  
                  <div className="flex items-center space-x-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 w-fit">
                     <div className="flex items-center font-medium text-gray-700">
                        <span className="text-xs text-gray-400 mr-2 uppercase">Source</span>
                        {item.source_schema.name}
                     </div>
                     <ArrowRight size={14} className="text-gray-400 mx-2"/>
                     <div className="flex items-center font-medium text-gray-700">
                        <span className="text-xs text-gray-400 mr-2 uppercase">Target</span>
                        {item.target_schema.name}
                     </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 md:border-l border-gray-100 md:pl-6">
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-gray-400 mb-1">Created</div>
                    <div className="text-sm font-medium text-gray-600">{new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                  <button className="p-2 text-primary-600 bg-primary-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-100">
                    <ArrowRight size={20} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteRecord(e, item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {!isLoading && schemaLinks.length === 0 && (
          <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <LayoutGrid size={48} className="mx-auto text-gray-300 mb-4"/>
            <h3 className="text-gray-500 font-medium">No traceability schemas found</h3>
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
                                {isLinked && <CheckCircle2 size={20} className="text-primary-600" />}
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
        title="Create New Traceability Scope"
      >
        <div className="space-y-4">
           <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex items-start">
             <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0"/>
             <p>Review the available documents. Click confirm to generate the traceability graph edges.</p>
           </div>
           
           <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
             {availableDocs.length === 0 ? (
               <div className="p-8 text-center text-gray-400">
                 No enabled documents found. Please add documents in Data Management first.
               </div>
             ) : (
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                     <tr>
                        <th className="px-4 py-2 text-xs font-semibold">Document Name</th>
                        <th className="px-4 py-2 text-xs font-semibold">Source</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {availableDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3">
                           <div className="flex items-center">
                              <FileText size={16} className="text-gray-400 mr-2 group-hover:text-primary-500"/>
                              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">{doc.name}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 flex items-center">
                           {doc.sourceType === 'Git' && <Github size={12} className="mr-1"/>}
                           {doc.sourceType === 'Jira' && <Globe size={12} className="mr-1"/>}
                           {doc.sourceName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
           </div>
           
           <div className="pt-2 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleConfirmCreation}
              className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg shadow-sm transition-colors font-medium text-sm"
            >
              Confirm
            </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};
