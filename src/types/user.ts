// /types/user.ts

export interface UserProfile {
  uid: string; // Firebase UID
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  emailVerified: boolean;
  created_at: string;
  created_by?: string; // UID of admin who created this user
  updated_at?: string;
  last_login?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName?: string;
  role: 'admin' | 'user';
}

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserRoleRequest {
  role: 'admin' | 'user';
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  // Other Firebase user properties as needed
}