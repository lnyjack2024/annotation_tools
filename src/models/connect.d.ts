import type { Dispatch } from "redux";
import type { RouterTypes } from "@umijs/max";

import type { MenuDataItem } from "@ant-design/pro-components";
import type { FlowCreationModelState } from "@/pages/project/workflow/models/flowCreation";
import type { ProjectModelState } from "@/pages/project/models/project";
import type { ProjectAccessModelState } from "@/pages/project/models/projectAccess";
import type { JobListModelState } from "@/pages/job/models/jobList";
import type { JobDetailModelState } from "@/pages/job/models/jobDetail";
import type { WorkerJobModelState } from "@/pages/worker-job/models/workerJob";
import type { TemplateAdminModelState } from "@/pages/superadmin-management/template/model";
import type { ProjectAdminModelState } from "@/pages/super-management/project-admin/models/projectAccess";
import type { TenantProjectModelState } from "@/pages/tenant-management/project-admin/models/tenantProject";
import type { BpoJobState } from "@/pages/bpo/models/bpoJobDetail";
import type { LoginModelState } from "./login";
import { UserModelState } from "./user";
import { DefaultSettings as SettingModelState } from "../../config/defaultSettings";
import type { FlowDetailModelState } from "@/pages/project/workflow/models/flowDetail";
import type { DataCenterModelState } from "@/pages/project/models/dataCenter";
import type { BpoManagementModelState } from "@/pages/bpo/models/bpoList";
import { JobDetailDrawerModelState } from "@/pages/project/workflow/models/jobDetail";
import type { UploadProgressState } from "@/pages/project/models/uploadProgress";

export { SettingModelState, UserModelState };

export interface Loading {
  effects: Record<string, boolean | undefined>;
  models: {
    menu?: boolean;
    setting?: boolean;
    user?: boolean;
    login?: boolean;
    project?: boolean;
    jobList?: boolean;
    workerJob?: boolean;
    template?: boolean;
    bpoJob?: boolean;
    flowCreation?: boolean;
    flowDetail?: boolean;
    uploadProgress?: boolean;
  };
}

export interface ConnectState {
  loading: Loading;
  settings: SettingModelState;
  user: UserModelState;
  login: LoginModelState;
  project: ProjectModelState;
  projectAccess: ProjectAccessModelState;
  projectAdmin: ProjectAdminModelState;
  tenantProject: TenantProjectModelState;
  jobList: JobListModelState;
  jobDetail: JobDetailModelState;
  workerJob: WorkerJobModelState;
  template: TemplateAdminModelState;
  bpoJob: BpoJobState;
  flowCreation: FlowCreationModelState;
  jobDetailDrawer: JobDetailDrawerModelState;
  flowDetail: FlowDetailModelState;
  dataCenter: DataCenterModelState;
  bpoManagement: BpoManagementModelState;
  uploadProgress: UploadProgressState;
}

export interface Route extends MenuDataItem {
  routes?: Route[];
}

/**
 * @type T: Params matched in dynamic routing
 */
export interface ConnectProps<T> extends Partial<RouterTypes<Route, T>> {
  dispatch?: Dispatch;
}
