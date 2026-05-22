export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  push_token: string | null;
};

export type Couple = {
  id: string;
  display_photo_path: string | null;
  tagline: string;
  relationship_start_date: string | null;
  theme_id: string | null;
  home_message_id: string | null;
  home_message_shown_at: string | null;
};

export type CoupleMember = {
  id: string;
  couple_id: string;
  user_id: string;
  role: 'owner' | 'partner';
  joined_at: string;
};

export type PairCode = {
  id: string;
  couple_id: string;
  code: string;
  qr_payload: string;
  expires_at: string;
  consumed_at: string | null;
};

export type Event = {
  id: string;
  couple_id: string;
  event_date: string;
  title: string;
  description: string | null;
  color: string;
  icon: string;
  reminder_days: number;
  romantic_note: string | null;
  created_by: string;
};

export type EventLocation = {
  id: string;
  event_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  show_on_map: boolean;
  place_id: string | null;
};

export type EventPhoto = {
  id: string;
  event_id: string;
  couple_id: string;
  storage_path: string;
  location_id: string | null;
  sort_order: number;
  uploaded_by: string;
  created_at: string;
};

export type Wish = {
  id: string;
  couple_id: string;
  type: 'place' | 'purchase';
  title: string;
  description: string | null;
  photo_path: string | null;
  status: 'pending' | 'fulfilled';
  fulfilled_at: string | null;
};

export type Goal = {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  saved_amount: number;
  currency: string;
};

export type Milestone = {
  id: string;
  couple_id: string;
  type: 'first_meeting' | 'first_date' | 'first_trip' | 'last_trip';
  title: string;
  milestone_date: string;
  description: string | null;
  photo_path: string | null;
};

export type Notification = {
  id: string;
  couple_id: string;
  user_id: string;
  actor_id: string;
  type: string;
  title: string;
  body: string;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type Theme = {
  id: string;
  name: string;
  primary_blue: string;
  primary_pink: string;
  is_default: boolean;
};
