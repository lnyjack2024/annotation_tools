import type { ModalCommonProp } from "@/types/common";
import { Button, Form, message, Modal, Radio, Spin } from "antd";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";
import AssignForm from "@/pages/project/data-center/components/data-assign/AssignForm";
import { allotData, checkRecords } from "@/services/project";
import type { AllotDataParam } from "@/types/project";
import type { Workflow } from "@/types/v3";
import type { DataType } from "@/types/dataset";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";

interface DataAssignProp extends ModalCommonProp {
  selectedRecordIds: number[];
  projectId: string;
  deselect: (ids: number[]) => void;
  handleDataAssignSuccess: () => void;
}

export default function DataAssignModal({
  visible,
  onCancel,
  selectedRecordIds = [],
  projectId,
  deselect,
  handleDataAssignSuccess,
}: DataAssignProp) {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState<DataType>();
  const [existedInAudit, setExistedInAudit] = useState<number[]>([]);
  const [existedInFlow, setExistedInFlow] = useState<number[]>([]);
  const [selectedFlows, setSelectedFlows] = useState<Workflow[]>([]);
  const [allottedList, setAllottedList] = useState({ sum: 0, dataList: [] });
  const [differentTypeStatistic, setDifferentTypeStatistic] = useState<{
    [key in DataType]?: number[];
  }>({});

  const differentTypeStatisticKeys = Object.keys(differentTypeStatistic);

  useEffect(() => {
    if (!selectedRecordIds.length || !visible) {
      return;
    }

    setLoading(true);
    checkRecords(projectId, selectedRecordIds)
      .then((resp) => {
        const {
          dataTypeAggregation = {},
          inFlow = [],
          auditingRecords = [],
        } = resp.data || {};

        setDifferentTypeStatistic(dataTypeAggregation);
        setExistedInFlow(inFlow);
        setExistedInAudit(auditingRecords);
      })
      .finally(() => setLoading(false));
  }, [selectedRecordIds, visible]);

  const closeModal = () => {
    if (allottedList.sum > 0) {
      handleDataAssignSuccess();
    }

    onCancel();
  };

  const handleConfirm = () => {
    if (existedInFlow.length > 0) {
      setExistedInFlow([]);
      return;
    }

    if (differentTypeStatisticKeys.length > 1) {
      if (!selectedDataType) {
        message.error(
          formatMessage({
            id: "project.detail.data-center.assign.error.different-type.required",
          })
        );
        return;
      }

      const abandonedData: number[] = [];
      differentTypeStatisticKeys.forEach((key) => {
        if (key !== selectedDataType) {
          abandonedData.push(...differentTypeStatistic[key]);
        }
      });
      deselect(abandonedData);
      setDifferentTypeStatistic({
        [selectedDataType]: differentTypeStatistic[selectedDataType],
      });
      return;
    }

    form.validateFields().then((formValues: Record<string, string>) => {
      const sum = Object.values(formValues).reduce(
        (total: number, item: string) => {
          return total + +item;
        },
        0
      );

      if (sum > selectedRecordIds?.length) {
        message.error(
          formatMessage({
            id: "project.detail.data-center.assign.error.limit",
          })
        );
        return;
      }

      const allotList = Object.entries(formValues).map(([key, value]) => ({
        flowId: key,
        recordNum: +value,
      }));

      if (allotList.length === 0) {
        message.error(
          formatMessage({
            id: "project.detail.data-center.assign.error.require",
          })
        );
        return;
      }

      setSubmitting(true);

      allotData({
        projectId,
        allotList,
        recordIds: Object.values(differentTypeStatistic)[0],
      } as AllotDataParam)
        .then((resp) => {
          if (resp.status === HttpStatus.OK) {
            setAllottedList({ sum: sum as number, dataList: allotList });
          } else {
            message.error(
              formatMessage(
                { id: "data.action.assign.error" },
                { error: mapStatusToErrorMessage(resp) }
              )
            );
          }
        })
        .finally(() => setSubmitting(false));
    });
  };

  const afterClose = () => {
    form.resetFields();
    setSelectedDataType(null);
    setDifferentTypeStatistic({});
    setExistedInFlow([]);
    setAllottedList({ sum: 0, dataList: [] });
  };

  const remove = () => {
    setExistedInFlow([]);
    deselect(existedInFlow);
    const records: { [key in DataType]?: number[] } = {};
    Object.entries(differentTypeStatistic).forEach(([key, value]) => {
      records[key] = value.filter((item) => existedInFlow.indexOf(item) === -1);
    });

    setDifferentTypeStatistic(records);
  };

  const handleWorkflowsChange = (flows: Workflow[]) => {
    setSelectedFlows(flows);
  };

  return (
    <Modal
      width={800}
      maskClosable={false}
      className="custom-modal"
      footer={null}
      visible={visible}
      onCancel={closeModal}
      title={formatMessage(
        { id: "common.selected" },
        { count: selectedRecordIds?.length }
      )}
      afterClose={afterClose}
      destroyOnClose
    >
      {allottedList.sum > 0 ? (
        <div>
          <p>
            {formatMessage(
              { id: "project.detail.data-center.assign.success.title" },
              { num: allottedList.sum }
            )}
          </p>
          {allottedList.dataList.map((item) => (
            <p key={item.recordNum}>
              {formatMessage(
                { id: "project.detail.data-center.assign.success.item" },
                {
                  num: item.recordNum,
                  flowName: selectedFlows.find(
                    (flow) => flow.id?.toString() === item.flowId
                  )?.flowName,
                }
              )}
            </p>
          ))}
        </div>
      ) : (
        <Spin spinning={loading}>
          {existedInFlow.length > 0 && (
            <div className="text-center">
              <div>{formatMessage({ id: "common.prompt" })}</div>
              <div>
                {formatMessage(
                  {
                    id: "project.detail.data-center.assign.error.existed-in-flow",
                  },
                  { count: existedInFlow?.length }
                )}
              </div>
              <Button type="link" onClick={remove}>
                {formatMessage(
                  { id: "data.action.jump" },
                  { count: existedInFlow?.length }
                )}
              </Button>
            </div>
          )}

          {existedInFlow.length === 0 &&
            (differentTypeStatisticKeys.length > 1 ||
              existedInAudit.length > 0) && (
              <div className="text-center">
                <div style={{ fontSize: 18, marginBottom: 8 }}>
                  {formatMessage({ id: "common.prompt" })}
                </div>
                <p className="margin-bottom-4">
                  {formatMessage({
                    id: "project.detail.data-center.assign.error.different-type",
                  })}
                </p>
                <Radio.Group
                  onChange={(e) => setSelectedDataType(e.target.value)}
                  value={selectedDataType}
                >
                  {differentTypeStatisticKeys.map((key) => (
                    <Radio key={key} value={key} style={{ display: "block" }}>
                      {formatMessage(
                        { id: "data.type.count" },
                        {
                          type: formatMessage({ id: `data.type.${key}` }),
                          count: differentTypeStatistic[key].length,
                        }
                      )}
                    </Radio>
                  ))}
                </Radio.Group>
                {existedInAudit.length > 0 && (
                  <div style={{ paddingTop: 12 }}>
                    {formatMessage(
                      {
                        id: "project.detail.data-center.assign.error.in-audit",
                      },
                      { num: existedInAudit.length }
                    )}
                  </div>
                )}
              </div>
            )}

          {existedInFlow.length === 0 &&
            differentTypeStatisticKeys.length === 1 && (
              <AssignForm
                projectId={projectId}
                form={form}
                onWorkflowsChange={handleWorkflowsChange}
              />
            )}

          <div className="text-right margin-top-4">
            <Button type="primary" ghost onClick={onCancel}>
              {formatMessage({ id: "common.cancel" })}
            </Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              className="margin-left-2"
              loading={submitting}
            >
              {formatMessage({
                id:
                  existedInFlow.length > 0
                    ? "common.continue.action"
                    : "common.confirm",
              })}
            </Button>
          </div>
        </Spin>
      )}
    </Modal>
  );
}
