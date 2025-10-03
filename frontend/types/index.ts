export type AuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

export type UserProfile = { id: string; email: string };

export type NotePasswordState = "set" | "change" | "remove";

export type Note = {
  id: string;
  user_id: string;
  title: string;
  hasPassword: boolean;
  created_at: string;
};

export type NoteWithContent = {
  id: string;
  user_id: string;
  title: string;
  json: any;
  created_at: string;
};