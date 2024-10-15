export interface Task {
  id: string;
  name: string;
  description: string;
  date: Date;
  start: Date;
  end: Date;
  contractorId: string;
  projectId: string;
  title: string;
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
