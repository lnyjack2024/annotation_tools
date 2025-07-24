import { Button, Radio } from "antd";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";

import type { Workflow } from "@/types/v3";
import type { Job } from "@/types/job";

export enum TurnbackStrategy {
  NOT_TURN_BACK = "NOT_TURN_BACK",
  TURN_BACK_TO_FIXED = "TURN_BACK_TO_FIXED",
  TURN_BACK_TO_POOL = "TURN_BACK_TO_POOL",
}

type Props = {
  onSubmit: (v: TurnbackStrategy) => void;
  flow: Workflow;
  labelJob?: Job;
};

const subTitleStyle = {
  marginBottom: 8,
  fontWeight: 500,
};

function FlowTurnbackConfig({ onSubmit, flow, labelJob }: Props) {
  const { formatMessage } = useIntl();

  const [allowTurnBack, setAllowTurnBack] = useState("no");
  const [turnBackToPool, setTurnBackToPool] = useState("no");

  const radioStyle = {
    display: "block",
    height: "40px",
  };

  const handleSubmit = () => {
    let option;
    if (allowTurnBack === "yes") {
      option =
        turnBackToPool === "yes"
          ? TurnbackStrategy.TURN_BACK_TO_POOL
          : TurnbackStrategy.TURN_BACK_TO_FIXED;
    } else {
      option = TurnbackStrategy.NOT_TURN_BACK;
    }
    onSubmit(option);
  };

  useEffect(() => {
    if (flow) {
      if (flow.reworkStrategy === TurnbackStrategy.TURN_BACK_TO_POOL) {
        setTurnBackToPool("yes");
        setAllowTurnBack("yes");
      } else if (flow.reworkStrategy === TurnbackStrategy.TURN_BACK_TO_FIXED) {
        setTurnBackToPool("no");
        setAllowTurnBack("yes");
      }
    }
  }, [flow]);

  return (
    <div style={{ overflow: "hidden" }}>
      <div style={{ margin: "32px 0px 18px" }}>
        <p style={subTitleStyle}>
          {formatMessage({ id: "turnback-switcher-tip" })}
        </p>
        <Radio.Group
          onChange={(e) => {
            setAllowTurnBack(e.target.value);
            setTurnBackToPool("");
          }}
          value={allowTurnBack}
        >
          <Radio value="yes" style={radioStyle}>
            {formatMessage({ id: "common.yes" })}
          </Radio>
          <Radio value="no" style={radioStyle}>
            {formatMessage({ id: "common.no" })}
          </Radio>
        </Radio.Group>
      </div>
      {allowTurnBack === "yes" && (
        <div style={{ margin: "18px 0px" }}>
          <p style={subTitleStyle}>
            {formatMessage({ id: "turnback-option-tip" })}
          </p>
          <Radio.Group
            onChange={(e) => {
              setTurnBackToPool(e.target.value);
            }}
            value={turnBackToPool}
          >
            <Radio value="no" style={radioStyle}>
              <span>{formatMessage({ id: "turnback-to-node" })}</span>
            </Radio>
            {/*<Radio*/}
            {/*  value="yes"*/}
            {/*  style={radioStyle}*/}
            {/*  disabled={labelJob?.workerNum > 1}*/}
            {/*>*/}
            {/*  <span>{formatMessage({ id: 'job.qa.turnBackToPool' })}</span>*/}
            {/*</Radio>*/}
          </Radio.Group>
        </div>
      )}

      <Button
        type="primary"
        disabled={
          !allowTurnBack || (allowTurnBack === "yes" && !turnBackToPool)
        }
        onClick={handleSubmit}
        style={{ float: "right" }}
      >
        {formatMessage({ id: "common.confirm" })}
      </Button>
    </div>
  );
}

export default FlowTurnbackConfig;
