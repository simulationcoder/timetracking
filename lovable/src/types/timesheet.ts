export type UserRole = 'employee' | 'manager' | 'admin';

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Project {
  id: string;
  name: string;
  code: string;
  clientName: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskDescription: string;
  date: string;
  hours: number;
  status: TimesheetStatus;
  employeeId: string;
  employeeName: string;
  notes?: string;
}

export interface WeeklyTimesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  weekStartDate: string;
  weekEndDate: string;
  entries: TimeEntry[];
  totalHours: number;
  status: TimesheetStatus;
}
