export enum RoleType {
  INTERNAL = 'Internal',
  BPO = 'BPO',
}

export interface Role {
  code: number;
  name: string;
  version: number;
  id: number;
  type: RoleType;
}
