export enum CycleStatus {
  PREPARING = 'PREPARING',
  TO_BE_APPLIED = 'TO_BE_APPLIED',
  REJECT = 'REJECT',
  APPLYING = 'APPLYING',
  DECLINED = 'DECLINED',
  WAIT_FOR_START = 'WAIT_FOR_START',
  WORKING = 'WORKING',
  PAUSE = 'PAUSE',
  FINISHED = 'FINISHED',
  STOP = 'STOP',
  ERROR = 'ERROR',
}

export interface WorkerLifecycle {
  cycleStatus: CycleStatus;
}
