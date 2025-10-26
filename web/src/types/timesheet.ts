export type UserRole = "employee" | "manager" | "admin";

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected";

export interface Project {
  id: number;
  name: string;
  client?: string | null;
  is_billable: boolean;
  team?: { id: number; name: string } | null;
}

export interface Activity {
  id: number;
  code: string;
  description?: string | null;
  project_id: number | null;
}

export interface TimesheetSummary {
  id: number;
  week_start: string;
  status: TimesheetStatus;
}

export interface TimeEntry {
  id: number;
  timesheet_id: number;
  project_id: number;
  activity_id: number;
  date: string;
  hours: number;
  notes?: string | null;
  billable: boolean;
}

export interface ApproverTimesheet {
  id: number;
  week_start: string;
  status: TimesheetStatus;
  employee: {
    id: number;
    name: string;
  };
  total_hours: number;
  approval: {
    id: number;
    decision: string | null;
    decided_at: string | null;
    comment: string | null;
  };
}

export interface ApproverSummary {
  id: number;
  name: string;
  email: string;
  roles: string[];
}
