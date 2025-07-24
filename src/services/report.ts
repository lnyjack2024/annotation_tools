import request from '@/utils/request';
import type { BaseResp, ReportContentItem, ReportType } from '@/types/common';
import type { ExportedFileItem } from '@/pages/file/FileCenter';
import type { Page, PageQueryParam } from '@/types';

export async function generatePartialReport(
  jobId: string,
  isWholeFlow: boolean,
): Promise<any> {
  return request.post('/job/report/result-report', {
    params: {
      jobId,
      isWholeFlow,
    },
  });
}

export async function getPartialReportStatus(jobId: string): Promise<any> {
  const url = '/job/report/partial-result-status';
  return request.get(url, {
    params: {
      jobId,
    },
  });
}

export async function generateDataListReport(data: {
  projectId: string;
  recordIds: number[];
  groupId: string;
  type: ReportType;
  contentItems: ReportContentItem[];
  scriptId?: string;
}) {
  return request.post('/project/result/report/result-report', {
    data,
  });
}

export async function generateBpoDataListReport(data: {
  projectId: string;
  recordIds: number[];
  jobId: string;
}) {
  return request.post('/project/result/report/bpo/result-report', {
    data,
  });
}

export async function getBpoDataListReportStatus(
  projectId: string,
  jobId: string,
  id: string,
) {
  return request.get('/project/result/report/bpo/report-result-status', {
    params: {
      projectId,
      jobId,
      id,
    },
  });
}

export async function getReportList(
  params: {
    projectId?: string;
    reportId?: string;
    search?: string;
  } & PageQueryParam,
) {
  return request.get<BaseResp<Page<ExportedFileItem[]>>>(
    '/project/report/center/list',
    {
      params,
    },
  );
}

export async function cancelReport(projectId: string, reportId: string) {
  return request.post('/project/report/center/cancel', {
    params: {
      projectId,
      reportId,
    },
  });
}
