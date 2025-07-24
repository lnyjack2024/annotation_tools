import type React from 'react';
import {
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
  FundOutlined,
  PauseCircleOutlined,
  RocketOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { getAPIGatewayPrefix } from '@/utils/env';

export const DEFAULT_PAGE_SIZE = 10;

export const WORKER_UPLOAD_URL_V3 = `${getAPIGatewayPrefix()}/job/workers-add`;

export const EDITOR_IMG_UPLOAD_API = '/project/file/img-upload';

export const LABEL_DETAIL_BY_JOB = `${getAPIGatewayPrefix()}/job/workload/label-details/download`;

export const QA_DETAIL_BY_JOB = `${getAPIGatewayPrefix()}/job/workload/qa-details/download`;

export const DEFAULT_JOB_TIMEOUT = 6; // 6 minutes

const PRIMARY_COLOR = '#227A7A';

export const StatusTagColor: Record<
  string,
  {
    bgColor: string;
    fontColor: string;
    Icon: React.FC<Record<string, any>>;
  }
> = {
  DRAFT: {
    fontColor: '#848899',
    bgColor: 'rgba(166, 169, 181, 0.2)',
    Icon: FormOutlined,
  },
  CONFIRMED: {
    fontColor: '#005FF7',
    bgColor: 'rgba(0, 95, 247, 0.1)',
    Icon: RocketOutlined,
  },
  READY: {
    fontColor: '#005FF7',
    bgColor: 'rgba(0, 95, 247, 0.1)',
    Icon: RocketOutlined,
  },
  LAUNCH: {
    fontColor: '#6B5BE5',
    bgColor: 'rgba(107, 91, 229, 0.1)',
    Icon: BulbOutlined,
  },
  STARTING_ERROR: {
    fontColor: '#df3636',
    bgColor: '#ffccd0',
    Icon: WarningOutlined,
  },
  RUNNING: {
    fontColor: PRIMARY_COLOR,
    bgColor: 'rgba(34, 122, 122, 0.1)',
    Icon: FundOutlined,
  },
  WORKING: {
    fontColor: PRIMARY_COLOR,
    bgColor: 'rgba(34, 122, 122, 0.1)',
    Icon: FundOutlined,
  },
  PAUSE: {
    fontColor: '#ff9c00',
    bgColor: '#fff0b9',
    Icon: PauseCircleOutlined,
  },
  STOPPED: {
    fontColor: '#ff9c00',
    bgColor: '#fff0b9',
    Icon: StopOutlined,
  },
  REJECT: {
    fontColor: '#df3636',
    bgColor: '#ffccd0',
    Icon: CloseCircleOutlined,
  },
  DECLINED: {
    fontColor: '#df3636',
    bgColor: '#ffccd0',
    Icon: CloseCircleOutlined,
  },
  DETAINED: {
    fontColor: '#a781e5',
    bgColor: '#e5defa',
    Icon: StopOutlined,
  },
  FINISHED: {
    fontColor: '#52C41A',
    bgColor: 'rgba(82, 196, 26, 0.1)',
    Icon: CheckCircleOutlined,
  },
  ERROR: {
    fontColor: '#F56C6C',
    bgColor: 'rgba(245, 108, 108, 0.1)',
    Icon: WarningOutlined,
  },
  TEMP_CLOSE: {
    fontColor: '#F56C6C',
    bgColor: 'rgba(245, 108, 108, 0.1)',
    Icon: WarningOutlined,
  },
  DEFAULT: {
    fontColor: '#848899',
    bgColor: 'rgba(166, 169, 181, 0.2)',
    Icon: WarningOutlined,
  },
};

export const POSITIVE_NUMBER_PATTERN = /^[1-9]+[\d]*$/;

export const PASSWORD_PATTERN =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)])+$)(?![0-9a-z]+$)(?![0-9A-Z]+$)(?![a-zA-Z]+$)(?![^(a-zA-Z)]+$)(?![^(a-z0-9)]+$)(?![^(0-9A-Z)]+$)^.{8,16}$/;

export const DEFAULT_RECORD_NUM = 1;

export const DEFAULT_WORKER_NUM = 1;

export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

export const DEFAULT_OCCUPY_STRING = ' - ';
