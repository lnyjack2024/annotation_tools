import type { WorkerLifecycle } from "@/types/worker";
import { CycleStatus } from "@/types/worker";
import { useEffect, useState } from "react";
import { JobStatus } from "@/types/job";
import { WorkerJobStatus } from "@/types/task";
import { getLocale, useIntl } from "@umijs/max";
import ReactFlow, {
  Handle,
  ArrowHeadType,
  Position,
} from "react-flow-renderer";
import type { Edge, Node } from "react-flow-renderer/dist/types";
import styles from "../styles.less";

interface WorkerLifeCycleProp {
  workerLifecycle: WorkerLifecycle;
  jobStatus: JobStatus;
  workerStatus: WorkerJobStatus;
}

interface NodeDataType {
  cycleStatus: CycleStatus;
  status: CycleStatus;
  label: string;
}

export default function WorkerLifeCycleComponent({
  workerLifecycle,
  jobStatus,
  workerStatus,
}: WorkerLifeCycleProp) {
  const locale = getLocale();
  const nodeTypes = { selectorNode: CustomLifeCycleNode };
  const intl = useIntl();
  const { formatMessage } = intl;
  const { cycleStatus } = workerLifecycle || {};
  const [elements, setElements] = useState<(Node<NodeDataType> | Edge<null>)[]>(
    []
  );

  const getLifeCycleItem = (
    status: CycleStatus,
    index: number
  ): Node<NodeDataType> => {
    return {
      id: status,
      type: "selectorNode",
      data: {
        cycleStatus,
        status: status,
        label: formatMessage({ id: `worker.lifecycle.${status}` }),
      },
      position: { x: 20 + 180 * index, y: 25 },
      draggable: false,
    };
  };

  const getLifeCycleData = (): Node<NodeDataType>[] => {
    const nodeData: Node<NodeDataType>[] = [
      getLifeCycleItem(CycleStatus.APPLYING, 0),
    ];
    if (workerStatus === WorkerJobStatus.DECLINED) {
      nodeData.push(getLifeCycleItem(CycleStatus.DECLINED, 1));
      return nodeData;
    }
    if (jobStatus === JobStatus.PAUSE) {
      nodeData.push(getLifeCycleItem(CycleStatus.PAUSE, 1));
      nodeData.push(getLifeCycleItem(CycleStatus.FINISHED, 2));
      return nodeData;
    }
    if (jobStatus === JobStatus.STOPPED) {
      nodeData.push(getLifeCycleItem(CycleStatus.WORKING, 1));
      nodeData.push(getLifeCycleItem(CycleStatus.STOP, 2));
      return nodeData;
    }
    nodeData.push(getLifeCycleItem(CycleStatus.WORKING, 1));
    nodeData.push(getLifeCycleItem(CycleStatus.FINISHED, 2));
    return nodeData;
  };

  const getEdgeData = (nodeData: Node<NodeDataType>[]): Edge<null>[] => {
    const length = nodeData.length;
    const edgeData: Edge<null>[] = [];
    for (let i = 1; i < length; i += 1) {
      edgeData.push({
        id: `${nodeData[i - 1].id}-${nodeData[i].id}`,
        source: nodeData[i - 1].id,
        target: nodeData[i].id,
        arrowHeadType: ArrowHeadType.Arrow,
      });
    }
    return edgeData;
  };

  useEffect(() => {
    if (workerLifecycle) {
      const nodeData = getLifeCycleData();
      setElements([...nodeData, ...getEdgeData(nodeData)]);
    }
  }, [jobStatus, workerLifecycle, locale]);

  return (
    <div>
      <div style={{ width: "100%", height: 120 }}>
        <ReactFlow
          elements={elements}
          defaultZoom={1}
          zoomOnScroll={false}
          nodeTypes={nodeTypes}
          paneMoveable={false}
        />
      </div>
    </div>
  );
}

function CustomLifeCycleNode({
  data,
  isConnectable,
}: {
  data: NodeDataType;
  isConnectable: boolean;
}) {
  const { cycleStatus, status, label } = data;
  const isActive = cycleStatus === status;
  const intl = useIntl();
  const { formatMessage } = intl;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: "hidden" }}
        isConnectable={isConnectable}
      />
      <div
        className={`${isActive ? styles.lifeCycleAnim : null} ${
          styles.lifeCycleContainer
        }`}
        style={{
          border: `1px solid ${isActive ? "#0091ff" : "#e5e7ed"}`,
          backgroundColor: isActive ? "#e5f4ff" : "#fff",
        }}
      >
        {isActive && (
          <span style={{ fontSize: 12, color: "#2f3838" }}>
            {formatMessage({ id: "worker.lifecycle.status" })}
          </span>
        )}
        <span
          style={{
            fontWeight: "500",
            fontSize: isActive ? 14 : 12,
            color: isActive ? "#2f3838" : "#a6a9b5",
          }}
        >
          {label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: "hidden" }}
        isConnectable={isConnectable}
      />
    </>
  );
}
