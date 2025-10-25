import { Project, TimeEntry, WeeklyTimesheet } from '@/types/timesheet';

export const mockProjects: Project[] = [
  { id: '1', name: 'Website Redesign', code: 'WEB-001', clientName: 'Acme Corp' },
  { id: '2', name: 'Mobile App Development', code: 'MOB-002', clientName: 'TechStart Inc' },
  { id: '3', name: 'Database Migration', code: 'DB-003', clientName: 'DataFlow Systems' },
  { id: '4', name: 'E-commerce Platform', code: 'EC-004', clientName: 'ShopNow Ltd' },
  { id: '5', name: 'Internal Tools', code: 'INT-005', clientName: 'Internal' },
];

export const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    projectId: '1',
    taskDescription: 'Frontend development',
    date: '2025-10-20',
    hours: 8,
    status: 'approved',
    employeeId: '1',
    employeeName: 'John Doe',
  },
  {
    id: '2',
    projectId: '2',
    taskDescription: 'API integration',
    date: '2025-10-21',
    hours: 6,
    status: 'submitted',
    employeeId: '1',
    employeeName: 'John Doe',
  },
  {
    id: '3',
    projectId: '1',
    taskDescription: 'UI/UX design review',
    date: '2025-10-22',
    hours: 4,
    status: 'submitted',
    employeeId: '2',
    employeeName: 'Jane Smith',
  },
  {
    id: '4',
    projectId: '3',
    taskDescription: 'Database schema design',
    date: '2025-10-22',
    hours: 7,
    status: 'draft',
    employeeId: '1',
    employeeName: 'John Doe',
  },
];

export const mockWeeklyTimesheets: WeeklyTimesheet[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'John Doe',
    weekStartDate: '2025-10-20',
    weekEndDate: '2025-10-26',
    entries: mockTimeEntries.filter(e => e.employeeId === '1'),
    totalHours: 21,
    status: 'submitted',
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'Jane Smith',
    weekStartDate: '2025-10-20',
    weekEndDate: '2025-10-26',
    entries: mockTimeEntries.filter(e => e.employeeId === '2'),
    totalHours: 38,
    status: 'approved',
  },
];
