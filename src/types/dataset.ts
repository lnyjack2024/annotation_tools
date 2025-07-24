export enum BatchStatus {
  READY = 'READY',
  APPEND_ERROR = 'APPEND_ERROR',
  PUBLISHED = 'PUBLISHED',
  PUBLISHING = 'PUBLISHING',
}

export type DatasetBatch = {
  id: string;
  batchId: number;
  jobId: string;
  path: string;
  recordNum: number;
  startRecordId: number;
  status: BatchStatus;
  activeStatus: 'ACTIVE';
  version: number;
};

export enum DataType {
  IMG = 'IMG',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  LIDAR = 'LIDAR',
  TEXT = 'TEXT',
}

export enum OriginDataStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  PREPROCESSING = 'PREPROCESSING',
}

export interface DataLocation {
  flowName: string;
  count: number;
  flowNum: number;
}

export enum SourceType {
  UPLOADED = 'UPLOADED',
  PRE_PROCESSED = 'PRE_PROCESSED',
  EXTERNAL = 'EXTERNAL',
  CSV_ZIP = 'CSV_ZIP',
  ORIGINAL_UPLOADED = 'ORIGINAL_UPLOADED',
}

export interface SourceFile {
  filePath: string;
  batchNum: number;
  batchName: string;
  totalNum: number;
  status: OriginDataStatus;
  dataLocations?: DataLocation[]; //deprecated
  source: SourceType;
  dataType: DataType;
  latestUploadTime: string;
}
