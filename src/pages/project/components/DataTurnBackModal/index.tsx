import React, { useState } from "react";
import { Dispatch, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { Button, Modal, Radio, Select, Spin } from "antd";
import { useTurnBackGroup } from "@/services/turn-back";
import TurnBackFlowGroupRadio from "@/pages/project/components/TurnBackFlowGroupRadio";
import useStep from "@/pages/project/components/DataTurnBackModal/useStep";

type Props = {
  visible: boolean;
  projectId: string;
  recordList: number[];
  onOk?: () => void;
  onCancel?: () => void;
  onRefresh?: () => void;
  dispatch: Dispatch;
};

const DataTurnBackModal: React.FC<Props> = ({
  visible,
  projectId,
  recordList,
  onCancel,
  dispatch,
}) => {
  const { formatMessage } = useIntl();
  const { turnBackGroups, loading } = useTurnBackGroup({
    target: "data-center",
    projectId,
    recordList,
    active: visible,
  });

  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [selectedTurnBackMode, setSelectedTurnBackMode] = useState<
    "true" | "false" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanup = () => {
    setSelectedTurnBackMode(null);
    setSelectedCycle(null);
    setSelectedFlowId(null);
  };

  const { currentStep, reset, next, prev } = useStep({
    onOk() {
      setSubmitting(true);
      dispatch({
        type: "dataCenter/bigDataAction",
        payload: {
          projectId,
          flowId: selectedFlowId,
          actionType: "turnback",
          recordIds: turnBackGroups.find(
            (item) => item.flowId === selectedFlowId
          ).recordList,
          backTo: selectedCycle,
          forceQA: selectedTurnBackMode === "true",
          callback: () => {
            cleanup();
            reset();
            onCancel();
            setSubmitting(false);
            // onRefresh();
          },
        },
      });
    },
    onCancel() {
      cleanup();
      reset();
      onCancel();
    },
    selectedFlowId,
    selectedCycle,
    selectedTurnBackMode,
  });

  const showInitStep = currentStep === "init" ? undefined : { display: "none" };
  const showBackToStep =
    currentStep === "backTo" ? undefined : { display: "none" };
  const showForceQAStep =
    currentStep === "forceQA" ? undefined : { display: "none" };

  return (
    <Modal
      title={formatMessage({ id: "turnback.search.modal.title" })}
      bodyStyle={{ height: 280, overflowY: "auto" }}
      visible={visible}
      maskClosable={false}
      className="custom-modal"
      onCancel={() => {
        cleanup();
        reset();
        onCancel();
      }}
      footer={
        <div style={{ paddingRight: 8 }}>
          <Button
            onClick={(e) => {
              e.preventDefault();
              prev.goto();
            }}
          >
            {prev.text}
          </Button>
          <Button
            type="primary"
            disabled={next.disabled}
            onClick={(e) => {
              e.preventDefault();
              next.goto();
            }}
          >
            {next.text}
          </Button>
        </div>
      }
    >
      <Spin spinning={loading || submitting}>
        <div style={showInitStep}>
          {turnBackGroups.length > 0 ? (
            <>
              <p>{formatMessage({ id: "turnback-flow-select" })}</p>
              <TurnBackFlowGroupRadio
                value={selectedFlowId}
                turnBackGroup={turnBackGroups}
                onChange={(flowId) => {
                  setSelectedFlowId(flowId);
                  setSelectedCycle(null);
                  setSelectedTurnBackMode(null);
                }}
              />
            </>
          ) : (
            formatMessage({ id: "no-valid-turnback-data" })
          )}
        </div>
        <div style={showBackToStep}>
          <p>{formatMessage({ id: "turnback-node-select" })}</p>
          {selectedFlowId && (
            <Select
              value={selectedCycle}
              style={{ width: 470 }}
              onSelect={(val: number) => {
                setSelectedCycle(val);
              }}
            >
              {turnBackGroups
                .find((item) => item.flowId === selectedFlowId)
                ?.backList.map((back) => (
                  <Select.Option key={back.cycle} value={back.cycle}>
                    {back.name}
                  </Select.Option>
                ))}
            </Select>
          )}
        </div>
        <div style={showForceQAStep}>
          <p>{formatMessage({ id: "turnback.search.modal.qa-mode" })}</p>
          <Radio.Group
            value={selectedTurnBackMode}
            onChange={(e) => {
              setSelectedTurnBackMode(e.target.value);
            }}
          >
            <Radio
              style={{
                display: "block",
                height: "30px",
                lineHeight: "30px",
              }}
              value="true"
            >
              {formatMessage({ id: "turnback.search.modal.qa-mode-mandatory" })}
            </Radio>
            <Radio
              style={{
                display: "block",
                height: "30px",
                lineHeight: "30px",
              }}
              value="false"
            >
              {formatMessage({ id: "turnback.search.modal.qa-mode-sampling" })}
            </Radio>
          </Radio.Group>
        </div>
      </Spin>
    </Modal>
  );
};

export default connect()(DataTurnBackModal);
