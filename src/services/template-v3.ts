import request from '@/utils/request';
import type { BaseResp } from '@/types/common';
import type { ProjectTemplate } from '@/types/v3';
import { getMashupAPIPrefix } from '@/utils/env';

/**
 * List all project templates
 */
export async function getProjectTemplates(projectId: string) {
  return request.get<BaseResp<ProjectTemplate[]>>('/template/list-by-project', {
    params: {
      projectId,
    },
  });
}

/**
 * List all template types
 */
export async function getTemplateTypes(): Promise<any> {
  return request('/template/get-types');
}

/*
 * Get global/project template by template id
 */
export async function getTemplateById(templateId: string) {
  return request.get<BaseResp<ProjectTemplate>>('/template/get', {
    params: {
      templateId,
    },
  });
}

/**
 * Get all global templates
 */
export async function getPublicTemplates() {
  return request.get<BaseResp<ProjectTemplate[]>>('/template/public/get_all');
}

export type ProjectTemplateHistory = {
  createdBy: string;
  createdTime: string;
  id: string;
  operatorEmail: string;
  operatorName: string;
  templateId: string;
  updatedBy: string;
  updatedTime: string;
  version: number;
};

/**
 * Get project template edit history list
 *
 * @param templateId
 */
export async function getProjectTemplateHistory(templateId: string) {
  return request.get<BaseResp<ProjectTemplateHistory[]>>('/template/history', {
    params: {
      templateId,
    },
  });
}

export async function getTemplateIdByJobId(jobId: string) {
  return request.get<BaseResp<string>>('/job/template', {
    params: {
      jobId,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                                 mashup api                                 */
/* -------------------------------------------------------------------------- */

/**
 * Create project template - mashup API
 * @param template
 * @param projectId
 */
export async function createProjectTemplate(
  template: Partial<ProjectTemplate>,
  projectId: string,
) {
  return request.post('/api/templates', {
    prefix: getMashupAPIPrefix(),
    data: {
      ...template,
      scope: 'PRIVATE',
      projectId,
    },
  });
}

/**
 * Update project template - mashup API
 * @param template
 */
export async function updateProjectTemplate(template: any) {
  return request.put('/api/templates', {
    prefix: getMashupAPIPrefix(),
    data: template,
  });
}

/**
 * Clone project template - mashup API
 * @param templateId
 */
export async function cloneProjectTemplate(templateId: string) {
  return request.post(`/template/clone?templateId=${templateId}`);
}

/* -------------------------------------------------------------------------- */
/*                                 super admin                                */
/* -------------------------------------------------------------------------- */

/**
 * Delete global template
 *
 * @param templateId
 */
export async function deletePublicTemplate(templateId: string) {
  return request.delete('/template/public/delete', {
    params: {
      templateId,
    },
  });
}

/**
 * Update global template
 *
 * @param template
 */
export async function updatePublicTemplate(template: ProjectTemplate) {
  return request.put<BaseResp<ProjectTemplate>>('/template/public/update', {
    data: template,
  });
}

export async function createPublicTemplate(template: ProjectTemplate) {
  return request.post('/template/public/create', {
    data: {
      ...template,
      scope: 'GLOBAL',
    },
  });
}
