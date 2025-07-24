import request from '@/utils/request';
import type {
  PasswordResetData,
  UserStatus,
  User,
  NewUser,
} from '@/types/user';
import { HttpMethod } from '@/types/http';
import type { BaseResp } from '@/types/common';
import { Page } from '@/types';
import { CurrentUser } from '@/models/user';
import { Role } from '@/types/auth';

export async function login(payload: { name: string; password: string }) {
  return request('/user/anon/login', {
    method: HttpMethod.POST,
    data: payload,
  });
}

export async function checkUserLoginOtherDevice(data: {
  name: string;
  password: string;
}) {
  return request('/user/anon/login/check-session', {
    method: HttpMethod.POST,
    data,
  });
}

export async function logout() {
  return request('/user/anon/logout', {
    method: HttpMethod.POST,
  });
}

export async function queryCurrent() {
  return request.get<BaseResp<CurrentUser>>('/user/current');
}

export type UserFilter = {
  name?: string;
  roleId?: string;
  tag?: string[];
  pageIndex: number;
  pageSize: number;
};

export async function getUserList(params: UserFilter) {
  return request.get<BaseResp<Page<User>>>('/user/all', {
    params,
  });
}

export async function getPrivateUserCount() {
  return request.get<BaseResp<number>>('/user/total-private-user-count');
}

export async function getPrivateUserLimit() {
  return request.get<BaseResp<number>>('/user/max-private-user-limit');
}

export async function deleteUser(params: { userId: string | number }) {
  return request.delete('/user', {
    params,
  });
}

export async function resetPassword(data: { name: string }) {
  return request.post('/user/reset-password', {
    data,
  });
}

export async function sendEmailVerficationCode() {
  return request.post('/user/send-auth-notice');
}

export async function validateVerficationCode(params: { authCode: string }) {
  return request.post('/user/validate-auth-code', {
    params,
  });
}

export async function assignRole(params: {
  userId: string | number;
  bpoId?: string;
  roleId: string[];
}) {
  return request.post('/user/role/assign', {
    params,
  });
}

export async function activateUser(params: { userId: string | number }) {
  return request.post('/user/activate', {
    params,
  });
}

export async function inactivateUser(params: { userId: string | number }) {
  return request.post('/user/inactivate', {
    params,
  });
}

export async function getUserTags() {
  return request.get('/user/tags');
}

export async function getBpoUserTags(bpoId?: string) {
  return request.get('/um/bpo-worker/tags', {
    params: {
      bpoId,
    },
  });
}

export async function createBpoUserTags(
  tagName: string,
  bpoId?: string,
): Promise<any> {
  return request.post('/um/bpo-worker/create-tag', {
    params: {
      tagName,
      bpoId,
    },
  });
}

export async function deleteBpoUserTags(
  tagId: string,
  bpoId?: string,
): Promise<any> {
  return request.delete('/um/bpo-worker/delete-tag', {
    params: {
      tagId,
      bpoId,
    },
  });
}

export async function updateBpoUserTags(
  tagIds: string[],
  workerId: number,
  bpoId?: string,
): Promise<any> {
  return request.post('/um/bpo-worker/update-tag', {
    params: {
      tagIds,
      workerId,
      bpoId,
    },
  });
}

export async function deleteUserTags(tagId: string): Promise<any> {
  return request.delete('/user/tag', {
    params: {
      tagId,
    },
  });
}

export async function createUserTags(tagName: string): Promise<any> {
  return request.put('/user/tag-create', {
    params: {
      tagName,
    },
  });
}

export async function updateUserTags(
  tagIds: string[],
  userId: string,
): Promise<any> {
  return request.post('/user/tag-assign', {
    params: {
      tagIds,
      userId,
    },
  });
}

export async function getBpoUserList(params: {
  bpoId?: string;
  name?: string;
  role?: number;
  tag?: string[];
  pageIndex: number;
  pageSize: number;
}): Promise<any> {
  return request.get('/um/bpo-worker/list', {
    params,
  });
}

export async function deleteBpoUser(params: {
  bpoId?: string;
  userId: string | number;
}): Promise<any> {
  return request.delete('/um/bpo-worker/delete', {
    params,
  });
}

export async function activeBpoUser(params: {
  bpoId?: string;
  userId: string | number;
  activeStatus: UserStatus;
}): Promise<any> {
  return request.post('/um/bpo-worker/active-status', {
    params,
  });
}

export async function createBpoUser(
  data: NewUser & { bpoId?: string },
): Promise<any> {
  const { bpoId, ...rest } = data;
  return request.post('/um/bpo-worker/create', {
    params: {
      bpoId,
    },
    data: rest,
  });
}

export async function createUser(data: NewUser): Promise<any> {
  return request.post('/user/create', {
    data,
  });
}

export async function getAllRoles(): Promise<BaseResp<Role[]>> {
  return request.get('/user/role/all');
}

export async function setNewPassword(
  params: PasswordResetData,
): Promise<BaseResp<User>> {
  return request.post('/user/anon/reset-password', {
    data: { ...params },
  });
}
