import request from '@/utils/request';
import type { BPO, BPOQueryParam } from '@/types/vm';

export function getBPOList(params: BPOQueryParam) {
  return request('/um/bpo/list', {
    params,
    method: 'get',
  });
}

export function createBpo(data: BPO) {
  return request('/um/bpo/create', {
    data,
    method: 'post',
  });
}

export function updateBpo(data: BPO) {
  return request('/um/bpo/update', {
    data,
    method: 'post',
  });
}

export function deleteBpo(bpoId: string) {
  return request('/um/bpo/delete', {
    params: {
      bpoId,
    },
    method: 'delete',
  });
}

export function getBpoDetail(bpoId: string) {
  return request('/um/bpo/detail', {
    params: {
      bpoId,
    },
    method: 'get',
  });
}

export function updateBPOActiveStatus(bpoId: string, activeStatus: string) {
  return request('/um/bpo/active-status', {
    params: {
      bpoId,
      activeStatus,
    },
    method: 'post',
  });
}

export function getGlobalTags() {
  return request.get('/um/bpo/tags', {
    params: {
      pageIndex: 0,
      pageSize: 10,
    },
  });
}

export function deleteTags(tagId: string) {
  return request.delete('/um/bpo/delete-tag', {
    params: {
      tagId,
    },
  });
}

export function addTags(tagName: string) {
  return request.post('/um/bpo/create-tag', {
    params: {
      tagName,
    },
  });
}

export function updateBPOAndGlobalTags(bpoId: string, tagIds: string[]) {
  return request.post('/um/bpo/update-tag', {
    params: {
      bpoId,
      tagIds,
    },
  });
}
