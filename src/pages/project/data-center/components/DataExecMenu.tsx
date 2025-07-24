import type { WorkflowDataRecord } from "@/types/v3";
import { Menu } from "antd";
import React from "react";
import type { ConnectState } from "@/models/connect";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { Dispatch } from "redux";
import { TurnBackStatus } from "@/pages/project/data-center/components/DataList";

type Props = {
  record?: WorkflowDataRecord;
  readonly: boolean;
  dispatch: Dispatch;
  projectId: string;
};

const DataExecMenu: React.FC<Props> = ({
  projectId,
  readonly,
  record,
  dispatch,
}: Props) => {
  const { formatMessage } = useIntl();

  const hasMatchedTurnBackStatus =
    !record || TurnBackStatus.find((item) => item === record.state);

  const handleSelect = (value: WorkflowDataRecord[]) => {
    dispatch({
      type: "dataCenter/updateSelectedData",
      payload: value,
    });
  };

  const toggleVisible = (payload: Record<string, boolean>) => {
    dispatch({
      type: "dataCenter/updateVisible",
      payload,
    });
  };

  return (
    <>
      {hasMatchedTurnBackStatus && (
        <Menu.Item
          key="turnBackV2"
          onClick={() => {
            if (record) {
              handleSelect([record]);
            }
            toggleVisible({ turnBackNewModalVisible: true });
          }}
          disabled={readonly}
        >
          {formatMessage({ id: "turnback.btn" })}
        </Menu.Item>
      )}
      <Menu.Item
        key="delete"
        onClick={() => {
          if (record) {
            handleSelect([record]);
          }
          toggleVisible({ deleteModalVisible: true });
        }}
        disabled={readonly}
      >
        {formatMessage({ id: "common.delete" })}
      </Menu.Item>
    </>
  );
};

function mapStateToProps({ dataCenter }: ConnectState) {
  return {
    selectedData: dataCenter.selectedData,
  };
}

export default connect(mapStateToProps)(DataExecMenu);
