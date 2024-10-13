export interface Task {
  id: string;
  name: string;
  description: string;
  start: Date;
  end: Date;
  contractorId: string;
  notes?: string;
}

export interface Contractor {
  id: string;
  name: string;
  color: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
}