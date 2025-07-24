import React, { useEffect, useState } from "react";
import ReactFlow, { Controls, MiniMap } from "react-flow-renderer";

import QAJobNode from "./QAJobNode";
import LabelJobNode from "./LabelJobNode";
import CustomEdge from "./CustomEdge";
import type { Job } from "@/types/job";
import { JobType } from "@/types/job";
import type { Workflow } from "@/types/v3";
import { JobFlowConverter } from "@/services/flowConverter";
import { PlusOutlined } from "@ant-design/icons";
import { MarkerDefinition } from "./MarkerDefinition";
import JobAddNode from "@/pages/project/workflow/WorkflowCreation/components/JobAddNode";
import TurnbackNode from "./TurnbackNode";

type Props = {
  showMiniMap?: boolean;
  showControl?: boolean;
  paneMoveable?: boolean;
  height?: number;
  jobs: Job[];
  workflow: Workflow;
  onJobCreate?: (jobType: JobType) => void;
  onTurnbackNodeClick?: () => void;
  onJobDelete?: (job: Job) => void;
  onJobTitleClick?: (job: Job) => void;
  onQAJobTurnbackChange?: (qaJob: Job, backTo: number) => void;
};

const FlowDiagram: React.FC<Props> = ({
  paneMoveable = false,
  showControl = false,
  showMiniMap = false,
  height = 600,
  jobs = [],
  workflow,
  onJobCreate,
  onTurnbackNodeClick,
  onJobDelete,
  onJobTitleClick,
  onQAJobTurnbackChange,
}) => {
  const [elements, setElements] = useState([]);

  const PlusButton = (
    <PlusOutlined
      style={{ fontSize: 18, padding: 10 }}
      onClick={(e) => {
        e.preventDefault();
        onJobCreate?.(JobType.QA);
      }}
    />
  );

  useEffect(() => {
    const converter = new JobFlowConverter(
      jobs,
      workflow,
      PlusButton,
      onTurnbackNodeClick,
      onJobDelete,
      onJobTitleClick,
      onQAJobTurnbackChange
    );

    const flowElements = converter.toFlowElements();
    setElements(flowElements);
  }, [jobs, workflow]);

  return (
    <div style={{ height }}>
      <ReactFlow
        nodesConnectable={false}
        elements={elements}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        paneMoveable={paneMoveable}
        nodeTypes={{
          qaJobNode: QAJobNode,
          labelJobNode: LabelJobNode,
          turnbackNode: TurnbackNode,
          jobAddNode: JobAddNode,
        }}
        edgeTypes={{
          customEdge: CustomEdge,
        }}
      >
        <MarkerDefinition id="edge-marker-red" color="#F56C6C" />
        {showControl && <Controls showInteractive={false} />}
        {showMiniMap && (
          <MiniMap
            key="minimap"
            nodeColor={(node) => {
              switch (node.type) {
                case "input":
                case "labelJobNode":
                  return "rgb(178,234,201)";
                case "default":
                  return "#00ff00";
                case "qaJobNode":
                case "output":
                  return "rgb(231,148,118)";
                default:
                  return "#eee";
              }
            }}
            nodeStrokeWidth={3}
          />
        )}
      </ReactFlow>
    </div>
  );
};

export default FlowDiagram;
