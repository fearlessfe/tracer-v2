import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Project, TraceType } from '../types';
import * as d3 from 'd3';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend as RechartsLegend
} from 'recharts';
import { AlertCircle, CheckCircle2, FileCheck, Layers, Share2, GitGraph, Maximize2, MousePointerClick, Activity } from 'lucide-react';

interface DashboardProps {
  project: Project;
}

// --- Constants & Types for Graph ---
const NODE_COUNTS = {
  REQ: 100,
  ARCH: 45,
  DD: 80,
  TC: 200
};

const COLORS = {
  REQ: '#3b82f6', // Blue
  ARCH: '#8b5cf6', // Purple
  DD: '#10b981', // Emerald
  TC: '#f59e0b', // Amber
  Unlinked: '#94a3b8'
};

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: 'REQ' | 'ARCH' | 'DD' | 'TC';
  name: string;
  r: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

// --- Helper to Generate Mock Data ---
const generateGraphData = () => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // 1. Generate Nodes
  for (let i = 1; i <= NODE_COUNTS.REQ; i++) nodes.push({ id: `REQ-${i}`, group: 'REQ', name: `Requirement ${i}`, r: 6 });
  for (let i = 1; i <= NODE_COUNTS.ARCH; i++) nodes.push({ id: `ARCH-${i}`, group: 'ARCH', name: `Architecture ${i}`, r: 8 });
  for (let i = 1; i <= NODE_COUNTS.DD; i++) nodes.push({ id: `DD-${i}`, group: 'DD', name: `Design ${i}`, r: 5 });
  for (let i = 1; i <= NODE_COUNTS.TC; i++) nodes.push({ id: `TC-${i}`, group: 'TC', name: `Test Case ${i}`, r: 4 });

  // 2. Generate Links (Randomly connect layers to simulate traceability)
  
  // REQ -> ARCH (Many REQs to one ARCH)
  nodes.filter(n => n.group === 'REQ').forEach((req, idx) => {
    // 90% of requirements map to an architecture
    if (Math.random() > 0.1) {
      const targetIndex = Math.floor(Math.random() * NODE_COUNTS.ARCH);
      links.push({ source: req.id, target: `ARCH-${targetIndex + 1}` });
    }
  });

  // ARCH -> DD (One ARCH to multiple DDs)
  nodes.filter(n => n.group === 'DD').forEach((dd) => {
    const targetIndex = Math.floor(Math.random() * NODE_COUNTS.ARCH);
    links.push({ source: `ARCH-${targetIndex + 1}`, target: dd.id });
  });

  // DD -> TC (One DD to multiple TCs, or REQ to TC direct)
  nodes.filter(n => n.group === 'TC').forEach((tc) => {
    const rand = Math.random();
    if (rand > 0.3) {
      // Link to Design
      const targetIndex = Math.floor(Math.random() * NODE_COUNTS.DD);
      links.push({ source: `DD-${targetIndex + 1}`, target: tc.id });
    } else {
      // Link directly to REQ (V-Model valid)
      const targetIndex = Math.floor(Math.random() * NODE_COUNTS.REQ);
      links.push({ source: `REQ-${targetIndex + 1}`, target: tc.id });
    }
  });

  return { nodes, links };
};

// --- D3 Traceability Graph Component ---
const TraceabilityGraph: React.FC<{ 
  mode: 'network' | 'tree' 
}> = ({ mode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [data] = useState(generateGraphData()); // Generate once
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = 600;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Graph Group with Zoom
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial Positions
    // In Tree mode, start them near their columns to avoid flying across screen
    if (mode === 'tree') {
       data.nodes.forEach(node => {
         node.y = height / 2 + (Math.random() - 0.5) * 50;
         if (node.group === 'REQ') node.x = width * 0.1;
         if (node.group === 'ARCH') node.x = width * 0.35;
         if (node.group === 'DD') node.x = width * 0.6;
         if (node.group === 'TC') node.x = width * 0.85;
       });
    }

    // Simulation Setup
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(mode === 'tree' ? 50 : 30))
      .force("charge", d3.forceManyBody().strength(mode === 'tree' ? -30 : -50))
      .force("center", d3.forceCenter(width / 2, height / 2));

    if (mode === 'tree') {
      // Layered positioning
      simulation.force("x", d3.forceX((d: any) => {
        if (d.group === 'REQ') return width * 0.1;
        if (d.group === 'ARCH') return width * 0.35;
        if (d.group === 'DD') return width * 0.6;
        if (d.group === 'TC') return width * 0.85;
        return width / 2;
      }).strength(1.5));
      
      simulation.force("y", d3.forceY(height / 2).strength(0.05)); // Slight centering vertical
      simulation.force("collide", d3.forceCollide(8)); // Prevent overlap
    } else {
      // Network positioning
      simulation.force("collide", d3.forceCollide(10));
    }

    // Render Links
    const link = g.append("g")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 1);

    // Render Nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", d => d.r)
      .attr("fill", d => COLORS[d.group])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .call(drag(simulation) as any)
      .on("mouseover", (event, d) => {
        setHoverNode(d);
        // Highlight logic
        d3.select(event.currentTarget).attr("stroke", "#1e293b").attr("stroke-width", 2).attr("r", d.r * 1.5);
      })
      .on("mouseout", (event, d) => {
        setHoverNode(null);
        d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 1.5).attr("r", d.r);
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [mode, data]); // Re-run when mode changes

  // Drag Helper
  function drag(simulation: d3.Simulation<GraphNode, undefined>) {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // Calculate Metrics
  const metrics = useMemo(() => {
    const orphanedReqs = data.nodes.filter(n => n.group === 'REQ' && !data.links.some(l => (l.source as any).id === n.id)).length;
    const unverifiedReqs = Math.floor(Math.random() * 20); // Mock
    const totalLinks = data.links.length;
    return { orphanedReqs, unverifiedReqs, totalLinks };
  }, [data]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
      <div className="flex-1 relative h-[600px] bg-slate-50" ref={wrapperRef}>
        <svg ref={svgRef} className="w-full h-full block touch-none"></svg>
        
        {/* Graph Controls overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur p-2 rounded-lg shadow border border-slate-200 text-xs">
            <div className="font-bold text-slate-700 mb-2">Graph Layout</div>
            <div className="flex items-center gap-2">
               <span className={`w-3 h-3 rounded-full bg-blue-500`}></span> REQ ({NODE_COUNTS.REQ})
            </div>
            <div className="flex items-center gap-2 mt-1">
               <span className={`w-3 h-3 rounded-full bg-purple-500`}></span> ARCH ({NODE_COUNTS.ARCH})
            </div>
            <div className="flex items-center gap-2 mt-1">
               <span className={`w-3 h-3 rounded-full bg-emerald-500`}></span> DD ({NODE_COUNTS.DD})
            </div>
            <div className="flex items-center gap-2 mt-1">
               <span className={`w-3 h-3 rounded-full bg-amber-500`}></span> TC ({NODE_COUNTS.TC})
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoverNode && (
          <div 
             className="absolute bg-slate-900 text-white text-xs px-3 py-2 rounded shadow-xl pointer-events-none z-10"
             style={{ left: 10, bottom: 10 }}
          >
             <div className="font-bold">{hoverNode.id}</div>
             <div className="text-slate-300">{hoverNode.name}</div>
          </div>
        )}
      </div>

      {/* Side Metrics Panel */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-6 flex flex-col">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <Activity size={18} className="mr-2 text-primary-600"/>
            Graph Metrics
         </h3>
         
         <div className="space-y-6">
            <div>
               <div className="text-xs text-slate-500 uppercase font-semibold">Traceability Health</div>
               <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Orphaned Reqs</span>
                  <span className="text-sm font-mono font-bold text-red-500">{metrics.orphanedReqs}</span>
               </div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(metrics.orphanedReqs / NODE_COUNTS.REQ) * 100}%` }}></div>
               </div>

               <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Relationships</span>
                  <span className="text-sm font-mono font-bold text-slate-800">{metrics.totalLinks}</span>
               </div>
            </div>

            <div>
               <div className="text-xs text-slate-500 uppercase font-semibold">Density by Layer</div>
               <div className="mt-2 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>REQ</span>
                    <span className="text-slate-600 font-mono">{NODE_COUNTS.REQ}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>ARCH</span>
                    <span className="text-slate-600 font-mono">{NODE_COUNTS.ARCH}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>DD</span>
                    <span className="text-slate-600 font-mono">{NODE_COUNTS.DD}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>TC</span>
                    <span className="text-slate-600 font-mono">{NODE_COUNTS.TC}</span>
                  </div>
               </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
               <p className="text-xs text-slate-400">
                  Visualizing {data.nodes.length} total artifacts and their bidirectional traces. Use the mouse wheel to zoom.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

const COLORS_CHART = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Mock Data for Charts (Preserved)
const dataStatus = [
  { name: 'Approved', value: 45 },
  { name: 'Draft', value: 20 },
  { name: 'In Review', value: 15 },
  { name: 'Obsolete', value: 5 },
];

const dataTraceability = [
  { name: 'Sys Req', coverage: 100 },
  { name: 'Sys Arch', coverage: 92 },
  { name: 'Soft Req', coverage: 85 },
  { name: 'Soft Arch', coverage: 78 },
  { name: 'Unit Test', coverage: 65 },
];

const dataTrend = [
  { name: 'W1', bugs: 2, tests: 10 },
  { name: 'W2', bugs: 5, tests: 25 },
  { name: 'W3', bugs: 3, tests: 45 },
  { name: 'W4', bugs: 8, tests: 60 },
  { name: 'W5', bugs: 4, tests: 85 },
];

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start space-x-4">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-white`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 my-1">{value}</h3>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ project }) => {
  const [graphMode, setGraphMode] = useState<'network' | 'tree'>('tree');

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Project Dashboard</h2>
          <p className="text-slate-500">Real-time overview of {project.name}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
           <button className="text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-colors flex items-center shadow-sm">
              <Share2 size={16} className="mr-2"/> Export Report
           </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Requirements" value={NODE_COUNTS.REQ} sub="+12 this week" icon={FileCheck} color="bg-blue-500" />
        <StatCard title="Architecture" value={NODE_COUNTS.ARCH} sub="Sys & Software" icon={Layers} color="bg-purple-500" />
        <StatCard title="Detailed Design" value={NODE_COUNTS.DD} sub="Files & Units" icon={FileCheck} color="bg-emerald-500" />
        <StatCard title="Test Cases" value={NODE_COUNTS.TC} sub="94% Pass Rate" icon={CheckCircle2} color="bg-amber-500" />
      </div>

      {/* Traceability Graph Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
             <GitGraph size={20} className="mr-2 text-primary-600"/>
             Live Traceability Matrix
          </h3>
          <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
             <button 
                onClick={() => setGraphMode('network')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center ${graphMode === 'network' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Share2 size={14} className="mr-1.5"/> Network
             </button>
             <button 
                onClick={() => setGraphMode('tree')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center ${graphMode === 'tree' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Maximize2 size={14} className="mr-1.5 rotate-90"/> Tree / Layers
             </button>
          </div>
        </div>
        
        <TraceabilityGraph mode={graphMode} />
      </div>

      {/* Bottom Charts (Existing) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Traceability Coverage (V-Model)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataTraceability} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="coverage" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Defect vs Test Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <RechartsLegend />
                <Line type="monotone" dataKey="tests" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="bugs" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};