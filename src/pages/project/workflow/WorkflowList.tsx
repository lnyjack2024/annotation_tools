import React, { useEffect, useState } from "react";
import { Button, message, Pagination, Spin } from "antd";
import { useIntl, history } from "@umijs/max";
import { connect } from "react-redux";
import type { ConnectState } from "@/models/connect";
import WorkflowCard from "@/pages/project/workflow/components/WorkflowCard";
import { getProjectFlowList } from "@/services/project";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import type { ProjectFlowParam } from "@/types/project";
import { mapStatusToErrorMessage, queryToSearch } from "@/utils/utils";
import WorkflowListFilter from "@/pages/project/workflow/components/WorkflowListFilter";
import FlowCreationModal from "@/pages/project/workflow/WorkflowCreation/components/FlowCreationModal";
import { updateFlow } from "@/services/workflow";
import { HttpStatus } from "@/types/http";
import { pathToRegexp } from "path-to-regexp";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

type Props = {
  isReadonly: boolean;
};

const WorkflowList: React.FC<Props> = ({ isReadonly }) => {
  const { formatMessage } = useIntl();
  const [, projectId] =
    pathToRegexp("#/projects/:projectId/workflow").exec(
      window.location.hash.split("?")[0]
    ) || [];

  const {
    query: { projectDisplayId },
  } = useLocationWithQuery();

  const [showFlowModal, setShowFlowModal] = useState(false);
  const [flowCreating, setFlowCreating] = useState(false);
  const [filter, setFilter] = useState<ProjectFlowParam>({
    pageSize: DEFAULT_PAGE_SIZE,
    pageIndex: 0,
    projectId: "",
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const getList = (needLoading: boolean = true) => {
    if (needLoading) {
      setLoading(true);
    }
    return getProjectFlowList({
      ...filter,
      projectId,
    })
      .then((resp) => {
        if (resp.data) {
          setData(resp.data.results || []);
          setTotal(resp.data.totalElements || 0);
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getList();
  }, [filter]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          height: 48,
          lineHeight: "32px",
          borderBottom: "1px solid #dcdfe3",
          margin: "0 -24px",
          padding: "0 24px",
        }}
      >
        <span style={{ fontSize: 16, color: "#42526e", fontWeight: "bold" }}>
          {formatMessage({ id: "workflow.list" })}
        </span>
        <Button
          type="primary"
          disabled={isReadonly}
          onClick={(e) => {
            e.preventDefault();
            setShowFlowModal(true);
          }}
        >
          {formatMessage({ id: "workflow.create" })}
        </Button>
      </div>
      <WorkflowListFilter
        projectId={projectId}
        onFilterChange={(newFilter) => {
          const { jobTeamType: [teamType, bpoId] = [] } = newFilter;
          setFilter({
            ...newFilter,
            jobTeamType: teamType,
            bpoId,
            pageIndex: 0,
            pageSize: filter.pageSize,
          });
        }}
      />
      <Spin spinning={loading}>
        {data.map((item) => (
          <WorkflowCard
            key={item?.id}
            workflow={item}
            projectId={projectId}
            projectDisplayId={projectDisplayId as string}
            onRefresh={getList}
            readonly={isReadonly}
          />
        ))}
        <Pagination
          style={{
            width: "100%",
            marginTop: 20,
            textAlign: "right",
          }}
          showTotal={(totalNum) => (
            <>
              {formatMessage(
                { id: "bpo-project-invitation.total" },
                { total: totalNum }
              )}
            </>
          )}
          current={filter.pageIndex + 1}
          total={total}
          pageSize={filter.pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          showSizeChanger
          onChange={(page, size) => {
            setFilter({ ...filter, pageIndex: page - 1, pageSize: size });
          }}
        />
      </Spin>
      <FlowCreationModal
        loading={flowCreating}
        projectId={projectId}
        visible={showFlowModal}
        onCancel={() => {
          setShowFlowModal(false);
        }}
        onOk={(flowData: any) => {
          setFlowCreating(true);
          updateFlow(flowData)
            .then((resp) => {
              setShowFlowModal(false);
              if (resp.status === HttpStatus.OK) {
                history.push({
                  pathname: `/workflows/${resp.data.id}/detail`,
                  search: queryToSearch({
                    projectDisplayId,
                    projectId: resp.data.projectId,
                  }),
                });
              } else {
                message.error(mapStatusToErrorMessage(resp));
              }
            })
            .catch((e) => message.error(mapStatusToErrorMessage(e)))
            .finally(() => {
              setFlowCreating(false);
            });
        }}
      />
    </>
  );
};

function mapStateToProps({ projectAccess }: ConnectState) {
  return {
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(WorkflowList);
