export type BookingStatus = 'inquiry' | 'quoted' | 'booked' | 'active' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  tenantId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventDate: string;
  eventVenue?: string;
  guestCount?: number;
  packageId?: string;
  packageName?: string;
  status: BookingStatus;
  amount?: number;
  notes?: string;
  quoteDescription?: string;
  quoteValidUntil?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  status: BookingStatus;
  timestamp: string;
  notes?: string;
}

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  inquiry: ['quoted', 'cancelled'],
  quoted: ['booked', 'cancelled'],
  booked: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const BOOKING_TAB_STATUSES: Record<string, BookingStatus[] | null> = {
  all: null,
  inquiries: ['inquiry', 'quoted'],
  active: ['booked', 'active'],
  completed: ['completed'],
  cancelled: ['cancelled'],
};
