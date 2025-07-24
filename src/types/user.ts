import { GlobalTag } from '@/types/vm';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TO_BE_ACTIVE = 'TO_BE_ACTIVE',
}

export interface User {
  activeStatus: UserStatus;
  email: null | string;
  id: string;
  initialPassword: string;
  type: string; // PRIVATE or COMPANY
  uniqueName: string;
  role: number[];
  tags: GlobalTag[];
  name?: string;
}

export interface BPOUser extends User {
  bpoId: number;
  workerId: number;
}

export type NewUser = Pick<User, 'uniqueName' | 'role' | 'tags'>;

export interface PasswordResetData {
  newPassword?: string;
  oldPassword?: string;
  password?: string;
  token?: string;
  name?: string;
}
