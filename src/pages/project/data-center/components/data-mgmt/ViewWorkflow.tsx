import { Button, Popover } from "antd";
import { useMemo } from "react";
import { useIntl } from "@umijs/max";

import type { SourceFile } from "@/types/dataset";
import { useAsync } from "@/hooks";
import { getProjectDataPoolDataLocation } from "@/services/project";
import { ProjectDataPoolDataLocationResult } from "@/types/project";

interface ViewWorkflowProps {
  record: SourceFile;
  projectId: string;
}
export function ViewWorkflow({ record, projectId }: ViewWorkflowProps) {
  const { formatMessage } = useIntl();

  const { data, fetchData } = useAsync<ProjectDataPoolDataLocationResult>(
    getProjectDataPoolDataLocation,
    {
      projectId,
      batchNum: record.batchNum,
    },
    false,
    []
  );

  function onVisibleChange(visible: boolean) {
    if (visible) {
      fetchData();
    }
  }

  const content = useMemo(
    () =>
      data?.map((item) => (
        <div style={{ padding: 8 }} key={`${record.batchNum}-${item.flowId}`}>
          {item.flowName}: {item.count}
        </div>
      )),
    [data]
  );

  return (
    <Popover
      placement="bottom"
      content={data ? content : null}
      onVisibleChange={onVisibleChange}
    >
      <Button type="link">
        {formatMessage({ id: "job-detail.ticket.view" })}
      </Button>
    </Popover>
  );
}
