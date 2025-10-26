export interface TeamMemberSummary {
  id: number;
  name: string;
  email: string;
}

export interface TeamSummary {
  id: number;
  name: string;
  leader: TeamMemberSummary | null;
}

