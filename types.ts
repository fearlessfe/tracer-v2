
export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'General' | 'KnowledgeBase';
  members: string[];
  createdAt: string;
  stats: {
    requirements: number;
    tests: number;
    bugs: number;
    coverage: number;
  };
  dataSources: DataSource[];
}

export type DataSourceType = 'Local' | 'Git' | 'Jira';

export type ParsingStatus = 'Unparsed' | 'Parsing' | 'ReviewNeeded' | 'Verified' | 'Structured';

export interface DocumentArtifact {
  id: string;
  name: string;
  type: string; // e.g., 'File', 'Issue', 'PDF', 'Markdown'
  size?: string;
  lastModified?: string;
  parsingStatus: ParsingStatus;
  isEnabled: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: 'Syncing' | 'Synced' | 'Error';
  isEnabled: boolean;
  lastSync: string;
  config: {
    url?: string;
    branch?: string;
    fileName?: string;
    projectKey?: string;
    [key: string]: any;
  };
  documents: DocumentArtifact[];
}

export enum TraceType {
  REQUIREMENT = 'Requirement',
  DESIGN = 'Design',
  CODE = 'Code',
  TEST = 'Test',
  RISK = 'Risk'
}

export interface TraceNode {
  id: string;
  label: string;
  type: TraceType;
  status: 'Draft' | 'Approved' | 'Verified' | 'Failed';
}

export interface TraceLink {
  source: string;
  target: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

// --- New API Types ---

export interface SchemaNodeInfo {
  id: string;
  name: string; // e.g. "requirement"
  description: string;
}

export interface SchemaLinkItem {
  id: string;
  relation_type: string; // e.g. "verifies"
  description: string;
  status: string; // e.g. "active"
  source_schema: SchemaNodeInfo;
  target_schema: SchemaNodeInfo;
  created_at: string;
  updated_at: string;
}

export interface SchemaLinkResponse {
  success: boolean;
  message: string;
  code: number;
  data: SchemaLinkItem[];
}