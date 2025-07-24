export enum UserAuthority {
  WORKER = "worker",
  PM = "pm",
  SUPER_ADMIN = "superadmin",
  BPO_WORKER = "bpoworker",
  BPO_PM = "bpopm",
}

export default [
  {
    path: "/user",
    component: "../layouts/UserLayout",
    layout: false,
    routes: [
      {
        name: "login",
        path: "/user/login",
        component: "./user/Login",
      },
      {
        component: "./404",
      },
    ],
  },
  {
    path: "/",
    component: "../layouts/GlobalLayout",
    menu: {
      flatMenu: true,
    },
    routes: [
      {
        path: "/",
        redirect: "/welcome",
      },
      {
        path: "/welcome",
        name: "welcome",
        icon: "dashboard",
        component: "./Welcome",
      },
      {
        path: "/projects",
        name: "project-v3",
        icon: "project",
        authority: [UserAuthority.PM],
        component: "./project/ProjectList",
      },
      {
        path: "/project-access",
        hideInMenu: true,
        component: "./project/ProjectAccessConfig",
        authority: [UserAuthority.PM],
      },
      {
        path: "/file-center",
        icon: "file",
        name: "file",
        component: "./file/FileCenter",
        authority: [UserAuthority.PM, UserAuthority.SUPER_ADMIN],
      },
      {
        path: "/bpo-list",
        name: "vm",
        icon: "apartment",
        authority: [UserAuthority.PM, UserAuthority.SUPER_ADMIN],
        component: "./bpo/superadmin/BPOList",
      },
      {
        path: "/bpo/:bpoId/workforce",
        name: "vm",
        hideInMenu: true,
        icon: "apartment",
        authority: [UserAuthority.PM, UserAuthority.SUPER_ADMIN],
        component: "./bpo/bpopm/BpoWorkerList",
      },
      {
        path: "/bpo-jobs",
        name: "bpo-jobs-v3",
        icon: "folder",
        component: "./bpo/bpo-job/JobList",
        authority: [UserAuthority.BPO_PM],
      },
      {
        path: "/bpo-job/:jobId",
        hideInMenu: true,
        name: "job-detail",
        component: "./bpo/bpo-job/JobDetail",
        authority: [UserAuthority.BPO_PM],
        routes: [
          {
            path: "/bpo-job/:jobId",
            redirect: "/bpo-job/:jobId/overview",
          },
          {
            path: "/bpo-job/:jobId/overview",
            name: "overview",
            component: "./bpo/bpo-job/job-detail/Overview",
          },
          {
            path: "/bpo-job/:jobId/data",
            name: "data",
            component: "./bpo/bpo-job/job-detail/DataCenter",
          },
          {
            path: "/bpo-job/:jobId/monitor",
            name: "monitor",
            component: "./bpo/bpo-job/job-detail/MonitorV3",
          },
          {
            path: "/bpo-job/:jobId/workforce",
            name: "workforce",
            component: "./bpo/bpo-job/job-detail/Workforce",
          },
        ],
      },
      // {
      //   path: '/projects/:projectId/audit-creation',
      //   name: 'audit',
      //   hideInMenu: true,
      //   authority: [UserAuthority.PM],
      //   component: './project/audit/Creation',
      // },
      {
        path: "/projects/:projectId",
        name: "project-detail",
        hideInMenu: true,
        authority: [UserAuthority.PM],
        component: "./project/ProjectDetail",
        routes: [
          {
            path: "/projects/:projectId/template-center",
            name: "template",
            component: "./project/template-center/TemplateCenter",
          },
          {
            path: "/projects/:projectId/template-center/edit",
            name: "template",
            component: "./project/template-center/TemplateCreation",
          },
          {
            path: "/projects/:projectId/data-center",
            name: "data-center",
            component: "./project/data-center/ProjectDataCenter",
          },
          {
            path: "/projects/:projectId/workflow",
            name: "workflow",
            component: "./project/workflow/WorkflowList",
          },
          {
            path: "/projects/:projectId/:recordId/record-detail",
            name: "data-center",
            component: "./project/data-center/RecordDetail",
          },
        ],
      },
      {
        path: "/workflows/:workflowId",
        name: "project-detail",
        hideInMenu: true,
        authority: [UserAuthority.PM],
        routes: [
          {
            path: "/workflows/:workflowId/detail",
            name: "workflow",
            hideInMenu: true,
            component: "./project/workflow/WorkflowDetail",
          },
          {
            path: "/workflows/:workflowId/jobs/workload",
            name: "workload",
            hideInMenu: true,
            component: "./project/workflow/WorkflowDetail/Workload",
          },
        ],
      },
      {
        path: "/worker-jobs",
        icon: "folder",
        name: "tasks-v3",
        authority: [UserAuthority.WORKER, UserAuthority.BPO_WORKER],
        routes: [
          {
            path: "/worker-jobs",
            redirect: "/worker-jobs/tasks",
          },
          {
            path: "/worker-jobs/tasks",
            component: "./worker-job/WorkerJobs",
            routes: [
              {
                path: "/worker-jobs/tasks",
                redirect: "/worker-jobs/tasks/in-progress",
              },
              {
                path: "/worker-jobs/tasks/pending",
                component: "./worker-job/JobAcceptList",
                hideInMenu: true,
              },
              {
                path: "/worker-jobs/tasks/in-progress",
                component: "./worker-job/JobTodoList",
                hideInMenu: true,
              },
              {
                path: "/worker-jobs/tasks/history",
                component: "./worker-job/JobHistoryList",
                hideInMenu: true,
              },
            ],
          },
          {
            name: "history",
            path: "/worker-jobs/:jobId/annotation-result-list",
            component: "./worker-job/AnnotationResultList",
            hideInMenu: true,
            authority: [UserAuthority.WORKER, UserAuthority.BPO_WORKER],
          },
        ],
      },
      {
        name: "workerJobDetail",
        path: "/worker-job/:jobId",
        hideInMenu: true,
        component: "./worker-job/WorkerJobDetail",
        authority: [UserAuthority.WORKER, UserAuthority.BPO_WORKER],
      },
      {
        name: "workforce",
        icon: "team",
        path: "/workforce",
        component: "./workforce/WorkforceManagement",
        authority: [UserAuthority.PM, UserAuthority.SUPER_ADMIN],
      },
      {
        name: "workforce",
        icon: "team",
        path: "/bpo-workforce",
        component: "./bpo/bpopm/BpoWorkerList",
        authority: [UserAuthority.BPO_PM],
      },
    ],
  },
];
