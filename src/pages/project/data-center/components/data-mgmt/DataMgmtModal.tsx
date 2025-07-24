import { message, Table, Form, Button } from "antd";
import { useIntl } from "@umijs/max";

import type { ModalCommonProp } from "@/types/common";
import AddDataModal from "@/pages/project/data-center/components/data-mgmt/AddDataModal";
import {
  checkProjectDataPoolBatchName,
  getOriginalData,
  putProjectDataPoolBatchName,
} from "@/services/project";
import { SourceFile, SourceType } from "@/types/dataset";

import { ModalButton } from "@/components/ModalButton";
import { EditableCell, EditableRow } from "./EditableNodes";
import styles from "./styles.less";
import { dateFormat, mapStatusToErrorMessage, safeFetch } from "@/utils";
import { useCommonListPageFetch } from "@/hooks";
import { ViewWorkflow } from "./ViewWorkflow";
import DataUploadLogModal from "./DataUploadLogModal";
import { GetOriginalDataParams, GetOriginalDataResult } from "@/types/project";
import { ModalWithModalWrap } from "@/components/ModalWithModalWrap";
import { useEffect } from "react";

type EditableTableProps = Parameters<typeof Table>[0];

type ColumnTypes = Exclude<EditableTableProps["columns"], undefined>;

interface DataMgmtProp extends ModalCommonProp {
  projectId: string;
  readonly?: boolean;
  onSearchDataBatch: (num: number) => void;
}
const initialPageData = {
  pageIndex: 0,
  pageSize: 10,
};
export default function DataMgmtModal({
  visible,
  readonly,
  onCancel,
  onSearchDataBatch,
  projectId,
}: DataMgmtProp) {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();
  const {
    pagination,
    data: dataList,
    setMemoSearchParams: fetchData,
    loading,
    refresh,
  } = useCommonListPageFetch<GetOriginalDataParams, GetOriginalDataResult>(
    getOriginalData,
    { projectId, ...initialPageData }
  );

  useEffect(() => {
    if (visible) {
      refresh();
    }
  }, [visible]);

  async function handleSave(row: SourceFile, cb: (o?: any) => void) {
    try {
      const res = await checkProjectDataPoolBatchName({
        projectId,
        batchName: row.batchName,
      });
      if (res.data) {
        safeFetch({
          params: {
            projectId,
            batchNum: row.batchNum,
            batchName: row.batchName,
          },
          api: putProjectDataPoolBatchName,
          onSuccess: () => {
            cb();
            fetchData({});
            message.success(
              formatMessage({
                id: "data.batch.name.edit.success",
              })
            );
          },
        });
      } else {
        message.error(mapStatusToErrorMessage(res));
      }
    } catch (e) {
      console.log("e: ", e);
    }
  }

  function onSearchBatchId(id: number) {
    onSearchDataBatch(id);
    onCancel();
  }

  const defaultColumns: (ColumnTypes[number] & {
    editable?: boolean;
    dataIndex: string;
  })[] = [
    {
      title: formatMessage({ id: "data.batch" }),
      dataIndex: "batchNum",
      width: 100,
      render: (batchNum, record) => (
        <Button
          type="link"
          disabled={!(record as SourceFile).totalNum}
          onClick={() => onSearchBatchId(batchNum)}
        >
          {batchNum}
        </Button>
      ),
    },
    {
      title: formatMessage({ id: "data.batch.name" }),
      dataIndex: "batchName",
      width: 260,
      editable: true,
    },
    {
      title: formatMessage({ id: "data.batch.upload.date" }),
      dataIndex: "latestUploadTime",
      width: 240,
      render: (latestUploadTime) =>
        dateFormat(latestUploadTime, "YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: formatMessage({ id: "data.total" }),
      dataIndex: "totalNum",
    },
    {
      title: formatMessage({
        id: "project.detail.data-center.add-data.data-type",
      }),
      dataIndex: "dataType",
      render: (type) =>
        formatMessage({
          id: type ? `data.type.${type}` : "common.nothing-symbol",
        }),
    },
    {
      title: formatMessage({
        id: "project.detail.data-center.origin-data-management.in-workflow",
      }),
      dataIndex: "dataLocations",
      render: (dataLocations, record) => (
        <ViewWorkflow record={record as SourceFile} projectId={projectId} />
      ),
    },
    {
      title: formatMessage({
        id: "data.batch.history",
      }),
      dataIndex: "history",
      render: (history, record) => (
        <ModalButton
          type="link"
          render={({ visible, onCancel }) => {
            return (
              <DataUploadLogModal
                visible={visible}
                projectId={projectId}
                batchNum={(record as SourceFile).batchNum}
                onCancel={onCancel}
              />
            );
          }}
        >
          {formatMessage({ id: "job-detail.ticket.view" })}
        </ModalButton>
      ),
    },
    {
      title: formatMessage({ id: "common.operation" }),
      dataIndex: "dataLocations",
      render: (_, record) => (
        <ModalButton
          type="link"
          onClick={() => form.setFieldsValue(record)}
          render={({ visible, onCancel }) => {
            return (
              <AddDataModal
                visible={visible}
                onCancel={onCancel}
                projectId={projectId}
                formData={[form]}
                addTypes={[SourceType.ORIGINAL_UPLOADED, SourceType.UPLOADED]}
                handleSubmitSuccess={() => handleUploadSuccess(onCancel)}
                isPushData
              />
            );
          }}
        >
          {formatMessage({ id: "data.batch.add" })}
        </ModalButton>
      ),
    },
  ];

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: SourceFile) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  function handleUploadSuccess(cb: () => void) {
    cb();
    fetchData({});
  }

  return (
    <ModalWithModalWrap
      width={"80%"}
      className="custom-modal"
      title={formatMessage({
        id: "project.detail.data-center.origin-data-management",
      })}
      footer={null}
      maskClosable={false}
      open={visible}
      onCancel={onCancel}
      destroyOnClose
    >
      <div className="text-right">
        <ModalButton
          type="primary"
          disabled={readonly}
          render={({ visible, onCancel }) => {
            return (
              <AddDataModal
                visible={visible}
                onCancel={onCancel}
                projectId={projectId}
                addTypes={[SourceType.ORIGINAL_UPLOADED, SourceType.UPLOADED]}
                handleSubmitSuccess={() => handleUploadSuccess(onCancel)}
              />
            );
          }}
        >
          {formatMessage({
            id: "project.detail.data-center.data-batch.create",
          })}
        </ModalButton>
      </div>

      <Table
        className="tableStriped"
        rowClassName={() => styles["editable-row"]}
        rowKey="batchNum"
        loading={loading}
        components={components}
        columns={columns as ColumnTypes}
        dataSource={dataList.results}
        pagination={pagination}
      />
    </ModalWithModalWrap>
  );
}
