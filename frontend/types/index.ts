export type AuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

export type UserProfile = { id: string; email: string };

export type Note = {
  id: string;
  user_id: string;
  title: string;
  json: any;
  created_at: string;
};