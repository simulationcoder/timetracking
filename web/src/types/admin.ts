export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  roles: string[];
  panels: string[];
}

export interface AdminRole {
  id: number;
  name: string;
}

export interface AdminPanelUpdate {
  panels: string[];
}

export interface AdminTeam {
  id: number;
  name: string;
  leader: {
    id: number;
    name: string;
    email: string;
    role: string;
    roles: string[];
    panels: string[];
  } | null;
  members: AdminUser[];
  created_at: string;
}
