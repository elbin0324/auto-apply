export interface UserCreate {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
