export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  firm_name: string;
  phone: string;
  is_admin: boolean;
  date_joined: string;
}

export interface Project {
  id: number;
  name: string;
  client_name: string;
  fiscal_year_end: string;
  created_by: User;
  members: User[];
  member_count: number;
  status: 'active' | 'locked' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ProjectOverview {
  id: number;
  name: string;
  client_name: string;
  fiscal_year_end: string;
  status: string;
  workpaper_total: number;
  workpaper_by_status: Record<string, number>;
  ledger_entry_count: number;
  open_adjustments: number;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  category: string;
  parent: number | null;
  project: number;
}

export interface LedgerEntry {
  id: number;
  project: number;
  account: Account;
  account_id: number;
  period: string;
  debit: string;
  credit: string;
  description: string;
  source_file: string;
  created_at: string;
}

export interface UploadResult {
  summary: {
    total_rows: number;
    parsed_rows: number;
    error_rows: number;
    total_debit: number;
    total_credit: number;
  };
  accounts_created: number;
  entries_created: number;
  errors: Array<{ row: number; error: string }>;
}

export interface A300CheckResult {
  rule: string;
  rule_name: string;
  passed: boolean;
  details: Record<string, number | string>;
  message: string;
}

export interface ImportBatch {
  id: number;
  project: number;
  uploaded_by: User;
  file_name: string;
  import_type: 'tb' | 'je';
  status: 'uploaded' | 'preview' | 'validated' | 'committed' | 'failed';
  overwrite_mode: 'append' | 'replace';
  period: string;
  version: number;
  is_active: boolean;
  total_rows: number;
  parsed_rows: number;
  error_rows_count: number;
  metadata: Record<string, any>;
  validation_summary: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PreviewData {
  batch_id: number;
  file_name: string;
  import_type: 'tb' | 'je';
  overwrite_mode: 'append' | 'replace';
  detected_columns: string[];
  guessed_mapping: Record<string, string>;
  total_rows: number;
  first_rows: Record<string, any>[];
  sample_rows: Record<string, any>[];
}

export interface ValidationResult {
  batch_id: number;
  is_valid: boolean;
  summary: {
    total_rows: number;
    parsed_rows: number;
    error_rows: number;
  };
  checks: Record<string, { passed: boolean; message: string }>;
  errors: Array<{
    row_number: number | null;
    error_type: string;
    error_message: string;
    raw_data: Record<string, any>;
  }>;
}

export interface ImportErrorRow {
  id: number;
  import_batch: number;
  row_number: number;
  raw_data: Record<string, any>;
  error_type: string;
  error_message: string;
  is_resolved: boolean;
  resolved_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
