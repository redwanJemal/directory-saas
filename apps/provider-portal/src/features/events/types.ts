export interface CommunityEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  imageUrl: string | null;
  maxAttendees: number | null;
  eventType: 'business' | 'community';
  isActive: boolean;
  _count: { rsvps: number };
  createdAt: string;
  updatedAt: string;
}
