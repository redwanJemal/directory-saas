export interface Wedding {
  id: string;
  title: string;
  date: string;
  estimatedGuests?: number;
  venue?: string;
  styles?: string[];
  events?: WeddingEvent[];
  collaborators?: Collaborator[];
  createdAt: string;
  updatedAt: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time?: string;
  venue?: string;
  notes?: string;
}

export interface Collaborator {
  id: string;
  email: string;
  name?: string;
  role: 'editor' | 'viewer';
}
