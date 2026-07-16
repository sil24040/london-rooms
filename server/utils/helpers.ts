import pool from '../config/db';

// --- Database Row Type Interfaces ---

export interface RoomRow {
  id: string;
  title: string;
  description: string;
  price: number | string;
  area: string;
  address: string;
  type: string;
  bills_included: boolean;
  available_now: boolean;
  landlord_id: string | number;
  landlord_name: string;
  saved_by?: (string | number)[];
  lat: number;
  lng: number;
  image: string | null;
  description_pt?: string | null;
  title_pt?: string | null;
  created_at: string | Date | number;
}

export interface EnquiryRow {
  id: string;
  room_id: string;
  room_title: string;
  room_area: string;
  room_price: number | string;
  tenant_id: string | number;
  tenant_name: string;
  landlord_id: string | number;
  landlord_name: string;
  message: string;
  reply: string | null;
  status: string;
  created_at: string | Date | number;
}

export interface BookingRow {
  id: string;
  room_id: string;
  room_title: string;
  room_area: string;
  room_price: number | string;
  tenant_id: string | number;
  tenant_name: string;
  landlord_id: string | number;
  landlord_name: string;
  message: string;
  status: string;
  created_at: string | Date | number;
  updated_at: string | Date | number;
}

export interface NotificationRow {
  id: string;
  user_id: string | number;
  type: string;
  message: string;
  link_page: string | null;
  read: boolean;
  created_at: string | Date | number;
}

export interface ReviewRow {
  id: string;
  room_id: string;
  room_title: string;
  tenant_id: string | number;
  tenant_name: string;
  landlord_id: string | number;
  rating: number;
  comment: string;
  created_at: string | Date | number;
  updated_at: string | Date | number;
}

// --- Helper Functions ---

// Generate a short unique id (used for room ids)
export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// London area → [lat, lng] lookup for placing rooms on the map
const AREA_COORDS: Record<string, [number, number]> = {
  E1: [51.5180, -0.0700], E2: [51.5290, -0.0610], E8: [51.5390, -0.0550], E9: [51.5390, -0.0420],
  E14: [51.5070, -0.0190], E15: [51.5390, -0.0040], E17: [51.5810, -0.0150],
  N1: [51.5390, -0.1020], N16: [51.5630, -0.0750],
  NW1: [51.5390, -0.1430], NW3: [51.5560, -0.1780],
  SE1: [51.4980, -0.0900], SE13: [51.4620, -0.0120], SE15: [51.4700, -0.0700], SE10: [51.4810, -0.0090],
  SW2: [51.4540, -0.1150], SW4: [51.4620, -0.1380], SW9: [51.4660, -0.1140], SW15: [51.4620, -0.2160],
  W1: [51.5140, -0.1490], W10: [51.5200, -0.2150],
};

export function coordsForArea(area: string): [number, number] {
  const match = area.match(/([A-Z]{1,2}\d{1,2})/);
  if (match && AREA_COORDS[match[1]]) {
    return AREA_COORDS[match[1]];
  }
  return [51.509 + (Math.random() - 0.5) * 0.06, -0.118 + (Math.random() - 0.5) * 0.1];
}

// Map a DB room row to the shape the frontend expects
export function mapRoom(r: RoomRow) {
  return {
    _id: r.id, 
    title: r.title, 
    description: r.description, 
    price: r.price,
    area: r.area, 
    address: r.address, 
    type: r.type,
    billsIncluded: r.bills_included, 
    availableNow: r.available_now,
    landlordId: r.landlord_id, 
    landlordName: r.landlord_name,
    savedBy: r.saved_by || [], 
    lat: r.lat, 
    lng: r.lng, 
    image: r.image,
    descriptionPt: r.description_pt || null,
    titlePt: r.title_pt || null,
    createdAt: new Date(r.created_at).getTime()
  };
}

// Map a DB enquiry row to the shape the frontend expects
export function mapEnquiry(e: EnquiryRow) {
  return {
    _id: e.id, 
    roomId: e.room_id, 
    roomTitle: e.room_title, 
    roomArea: e.room_area, 
    roomPrice: e.room_price,
    tenantId: e.tenant_id, 
    tenantName: e.tenant_name,
    landlordId: e.landlord_id, 
    landlordName: e.landlord_name,
    message: e.message, 
    reply: e.reply, 
    status: e.status,
    createdAt: new Date(e.created_at).getTime()
  };
}

// Map a DB booking row to the shape the frontend expects
export function mapBooking(b: BookingRow) {
  return {
    _id: b.id, 
    roomId: b.room_id, 
    roomTitle: b.room_title, 
    roomArea: b.room_area, 
    roomPrice: b.room_price,
    tenantId: b.tenant_id, 
    tenantName: b.tenant_name,
    landlordId: b.landlord_id, 
    landlordName: b.landlord_name,
    message: b.message, 
    status: b.status,
    createdAt: new Date(b.created_at).getTime(),
    updatedAt: new Date(b.updated_at).getTime()
  };
}

// Map a DB notification row to the shape the frontend expects
export function mapNotification(n: NotificationRow) {
  return {
    _id: n.id, 
    userId: n.user_id, 
    type: n.type, 
    message: n.message,
    linkPage: n.link_page, 
    read: n.read,
    createdAt: new Date(n.created_at).getTime()
  };
}

// Map a DB review row to the shape the frontend expects
export function mapReview(rv: ReviewRow) {
  return {
    _id: rv.id, 
    roomId: rv.room_id, 
    roomTitle: rv.room_title,
    tenantId: rv.tenant_id, 
    tenantName: rv.tenant_name, 
    landlordId: rv.landlord_id,
    rating: rv.rating, 
    comment: rv.comment,
    createdAt: new Date(rv.created_at).getTime(),
    updatedAt: new Date(rv.updated_at).getTime()
  };
}

// Insert a notification for a user. Swallows errors so a notification failure
// never breaks the primary action (e.g. sending an enquiry reply).
export async function notify(userId: string | number, type: string, message: string, linkPage?: string | null): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, message, link_page) VALUES ($1,$2,$3,$4)',
      [userId, type, message, linkPage || null]
    );
  } catch (e) {
    console.error('notify() failed:', e);
  }
}