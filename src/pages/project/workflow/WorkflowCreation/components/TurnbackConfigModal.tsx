import React from "react";
import { Modal } from "antd";
import { useIntl } from "@umijs/max";

import type { TurnbackStrategy } from "./FlowTurnbackConfig";
import FlowTurnbackConfig from "./FlowTurnbackConfig";
import type { Workflow } from "@/types/v3";
import type { ModalFuncProps } from "antd/es";
import type { Job } from "@/types/job";

type Props = {
  visible?: boolean;
  flow: Workflow;
  jobs?: Job[];
  onSubmit?: (option: TurnbackStrategy) => void;
} & ModalFuncProps;

const TurnbackConfigModal: React.FC<Props> = ({
  flow,
  jobs = [],
  onSubmit,
  visible,
  ...modalProps
}) => {
  const { formatMessage } = useIntl();
  const [labelJob] = jobs;

  return (
    <Modal
      {...modalProps}
      title={formatMessage({ id: "turnback-config-modal-title" })}
      className="custom-modal"
      visible={visible}
      maskClosable={false}
      footer={null}
    >
      <FlowTurnbackConfig onSubmit={onSubmit} flow={flow} labelJob={labelJob} />
    </Modal>
  );
};

export default TurnbackConfigModal;
