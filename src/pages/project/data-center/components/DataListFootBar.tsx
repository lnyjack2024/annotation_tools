import { Button, Dropdown, message, Menu } from "antd";
import { PAGE_SIZE_OPTIONS } from "@/utils/constants";
import DataExport from "@/pages/project/data-center/components/data-export";
import { DownOutlined } from "@ant-design/icons";
import DataSelectFootBar from "@/pages/project/data-center/components/DataSelectFootBar";
import { getAllFilteredIds } from "@/services/project";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { ConnectState } from "@/models/connect";
import { WorkflowDataRecord } from "@/types/v3";
import type { Dispatch } from "redux";
import { FilterParam } from "@/pages/project/models/dataCenter";
import DataExecMenu from "@/pages/project/data-center/components/DataExecMenu";
import { ColumnProps } from "antd/es/table";

type Props = {
  selectedData: WorkflowDataRecord[];
  total: number;
  readonly: boolean;
  dataRecords: WorkflowDataRecord[];
  projectId: string;
  dispatch: Dispatch;
  filterParams: FilterParam;
  columns: ColumnProps<WorkflowDataRecord>[];
};

const recordReg = /[,\s]/g;

function DataListFootBar({
  projectId,
  readonly,
  total,
  dataRecords,
  columns,
  selectedData,
  filterParams,
  dispatch,
}: Props) {
  const [btnLoading, setBtnLoading] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const selectedRecordIds = selectedData.map((item) => item.recordId);
  const { formatMessage } = useIntl();

  const handleSelect = (value: WorkflowDataRecord[]) => {
    dispatch({
      type: "dataCenter/updateSelectedData",
      payload: value,
    });
  };

  const selectAll = () => {
    setBtnLoading(true);
    getAllFilteredIds({
      ...filterParams,
      recordIds: filterParams?.recordIds
        ? filterParams?.recordIds.trim().split(recordReg)
        : [],
      pageSize: undefined,
      pageIndex: undefined,
      projectId,
    })
      .then((resp) => {
        setSelectedAll(true);
        handleSelect(resp.data.map((item: string) => ({ recordId: item })));
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setBtnLoading(false));
  };

  useEffect(() => {
    if (selectedData.length === 0) {
      setSelectedAll(false);

      return;
    }

    if (!selectedData[0].dataType) {
      setSelectedAll(true);
    }
  }, [selectedData]);

  return (
    <DataSelectFootBar
      barVisible={true}
      columns={columns.slice(0, 5)}
      selectedData={selectedData}
      onDeselect={(record: WorkflowDataRecord) => {
        handleSelect(
          selectedData.filter((item) => item.recordId !== record.recordId)
        );
      }}
      disabled={selectedAll}
      onClear={() => {
        handleSelect([]);
      }}
      selectAllButton={
        Array.isArray(dataRecords) &&
        dataRecords.length > 0 && (
          <Button
            loading={btnLoading}
            style={{ marginRight: 16 }}
            disabled={readonly}
            onClick={selectAll}
          >
            {formatMessage({ id: "common.select-all-filter" })}
          </Button>
        )
      }
      pagination={{
        total,
        pageSize: filterParams.pageSize,
        onChange: (page: number, pageSize?: number) =>
          dispatch({
            type: "dataCenter/updateFilters",
            payload: {
              ...filterParams,
              pageSize,
              pageIndex: page - 1,
            },
          }),
        current: filterParams.pageIndex + 1,
        showTotal: (val) =>
          formatMessage({ id: "common.total.items" }, { items: val }),
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
      }}
      actions={
        selectedData.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <Button
                type="primary"
                ghost
                disabled={readonly}
                onClick={() =>
                  dispatch({
                    type: "dataCenter/updateVisible",
                    payload: { assignModalVisible: true },
                  })
                }
              >
                {formatMessage({ id: "data.action.assign" })}
              </Button>
              <DataExport
                projectId={projectId}
                readonly={readonly}
                recordIds={selectedRecordIds}
                style={{ marginLeft: 12 }}
              />
              <Dropdown
                placement="topRight"
                trigger={["hover"]}
                overlay={
                  <Menu style={{ textAlign: "center" }} disabled={readonly}>
                    <DataExecMenu projectId={projectId} readonly={readonly} />
                  </Menu>
                }
              >
                <Button style={{ marginLeft: 12 }} type="primary" ghost>
                  {formatMessage({ id: "common.more-operation" })}{" "}
                  <DownOutlined style={{ marginLeft: 8 }} />
                </Button>
              </Dropdown>
            </div>
          </div>
        )
      }
    />
  );
}

function mapStateToProps({ dataCenter }: ConnectState) {
  return {
    selectedData: dataCenter.selectedData,
    dataRecords: dataCenter.data,
    total: dataCenter.total,
    filterParams: dataCenter.filter,
  };
}

export default connect(mapStateToProps)(DataListFootBar);
