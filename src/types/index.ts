// =============================================
// WHATSAPP API TYPES - VERSION BASICA
// =============================================

export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      messages?: WhatsAppIncomingMessage[];
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'document' | 'audio';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
    };
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

export interface WhatsAppOutgoingMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'interactive';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
}

// =============================================
// DATABASE TYPES BÁSICOS
// =============================================

export interface User {
  id: string;
  phone_number: string;
  role: string;
  name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'interactive' | 'image';
  content?: string;
  meta_message_id?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  created_at: string;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export enum RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export enum EventType {
  SPECIAL_EVENT = 'special_event',
  CLASS = 'class',
  SEMINAR = 'seminar',
  MILONGA = 'milonga',
  PRACTICE = 'practice'
}

export enum ClassLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ALL_LEVELS = 'all_levels'
}


export interface EventSchedule {
  id: string;
  event_id: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time?: string;
  timezone: string;
  recurrence_pattern: RecurrencePattern;
  recurrence_rule?: Record<string, any>;
  days_of_week?: DayOfWeek[];
  ends_at?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  event_type: EventType;
  description?: string;
  class_level?: ClassLevel;
  price?: number;
  address?: string;
  has_limited_capacity: boolean;
  max_capacity?: number;
  current_attendees: number;
  attendance_tracking: boolean;
  thumbnail_image_url?: string;
  thumbnail_meta_id?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface EventTeacher {
  id: string;
  event_id: string;
  teacher_id: string;
  is_primary_teacher: boolean;
  created_at: string;
}

export interface EventWithDetails extends Event {
  event_images: any;
  event_teachers: any;
  event_schedules: any;
  schedules?: EventSchedule[];
  images?: EventImage[];
  teachers?: (EventTeacher & { teacher: User })[];
}

export interface EventImage {
  id: string;
  event_id: string;
  image_url: string;
  meta_media_id?: string;
  caption?: string;
  display_order: number;
  created_at: string;
} 