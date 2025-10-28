export type UserRole = 'owner' | 'user';

export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Contact {
  id: string;
  orgId: string;
  name: string;
  phoneNumber: string;
  createdByUserId: string;
  createdByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Call {
  id: string;
  orgId: string;
  contactId?: string;
  contactName?: string;
  userId: string;
  phoneNumber: string;
  direction: 'incoming' | 'outgoing';
  startTime: string;
  duration: number;
}

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
}
