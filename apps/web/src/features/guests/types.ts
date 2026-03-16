export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group: string;
  side: string;
  events: string[];
  rsvp: 'attending' | 'declined' | 'pending';
  mealChoice?: string;
  dietaryNotes?: string;
  createdAt: string;
  updatedAt: string;
}
