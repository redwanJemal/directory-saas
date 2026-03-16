export interface ChecklistTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  assignedTo?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
