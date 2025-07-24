import { Tag } from '@/pages/bpo/components/BPOTagComponent';

export enum BPOApplyStatus {
  APPLYING = 'APPLYING',
  DECLINED = 'DECLINED',
  APPLYING_DECLINED = 'APPLYING_DECLINED',
  UPDATED_DECLINED = 'UPDATED_DECLINED',
  APPROVED = 'APPROVED',
  UPDATED = 'UPDATED', // BPO modify info after approved
  RESUBMITTED = 'RESUBMITTED', // BPO modify info and resubmit after declined
  APPLY = 'APPLY', // Create BPO
  MODIFY = 'UPDATE', // Update BPO
}

export const BPOTabs = {
  APPROVED: [BPOApplyStatus.APPROVED],
  APPLYING: [
    BPOApplyStatus.APPLYING,
    BPOApplyStatus.UPDATED,
    BPOApplyStatus.RESUBMITTED,
  ],
  DECLINED: [BPOApplyStatus.APPLYING_DECLINED, BPOApplyStatus.UPDATED_DECLINED],
};

export enum BPOActiveStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type GlobalTag = {
  id: string;
  name: string;
};

export interface BPO {
  activeStatus: BPOActiveStatus;
  address: string;
  businessDTO: {
    businessRequirements: BusinessDTO;
  };
  businessDescription: string;
  bpoDisplayId: string;
  bpoCode: string;
  city: string;
  createdTime: string;
  contact: string;
  contactEmail: string;
  contactPhone: string;
  contactWechat: string;
  country: string;
  declineReason: string;
  establishTime: string;
  financeDTO: FinanceDTO;
  id: string;
  name: string;
  bpoId?: string;
  bpoName?: string;
  province: string;
  status: BPOApplyStatus;
  statusChangeTime: string;
  tags: Tag[];
  workerID: string;
  workerNumber: number;
  currentWorkerNumber: number;
  isOversea?: boolean;
  industryCategory?: string;
  representativeCorporation?: string;
  fax: string;
  registeredAddress: string;
  businessAddress: string;
  zipCode: string;
}

export interface FinanceDTO {
  bankName: string;
  bankAccount: string;
  bankAddress: string;
  bankCity: string;
  bankCountry: string;
  bankProvince: string;
  businessLicense: string;
  contractAddress: string;
  contractCity: string;
  contractCountry: string;
  contractProvince: string;
  contractReceiver: string;
  contractReceiverPhone: string;
  invoiceRate: TaxPoint;
  taxID: string;
  taxRegistrationID: string;
  certificateResidency?: string;
  certificateIncorporation?: string;
  hasNativeEmployee?: string;
  swiftCode?: string;
}

export interface BusinessDTO {
  mostNumOneWeek: string;
  mostNumTwoWeek: string;
  payByTime: 'true' | 'false';
  payByCount: 'true' | 'false';
  perCost: string;
  otherLanguageFlag: string;
  otherLanguages: string;
  is3DFlag: 'true' | 'false';
  ownLabelFlag: 'true' | 'false';
  isCollectionFlag: 'true' | 'false';
  ownDbFlag: 'true' | 'false';
  collectionOrAnnotation?: string;
  languageList?: string;
  website?: string;
  businessYears?: number;
  scopeWork?: string;
}

export interface BPOQueryParam {
  bpoName: string;
  bpoStatusList: BPOApplyStatus[];
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  tags: string;
}

export enum TaxPoint {
  ONE_PERCENT = 'ONE_PERCENT',
  THREE_PERCENT = 'THREE_PERCENT',
  SIX_PERCENT = 'SIX_PERCENT',
}
