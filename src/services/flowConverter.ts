import type React from 'react';
import type { Edge, Elements, Node } from 'react-flow-renderer';
import { ArrowHeadType, Position } from 'react-flow-renderer';

import type { Job } from '@/types/job';
import { JobType } from '@/types/job';
import type { Workflow } from '@/types/v3';
import { HandleId } from '@/pages/project/workflow/WorkflowCreation/components/LabelJobNode';
import { TurnbackStrategy } from '@/pages/project/workflow/WorkflowCreation/components/FlowTurnbackConfig';

const FLOW_NODE_WIDTH = 260;
const FLOW_JOB_NODE_HEIGHT = 80;

export class JobFlowConverter {
  nodes: Node[] = [];
  edges: Edge[] = [];
  qaTurnbackMap: Record<number, number[]> = {};

  constructor(
    private jobs: Job[],
    private workflow: Workflow,
    private plusNode: React.ReactNode,
    private onTurnbackNodeClick: () => void,
    private onJobDelete: (job: Job) => void,
    private onJobTitleClick: (job: Job) => void,
    private onQAJobTurnbackChange: (job: Job, backTo: number) => void,
  ) {}

  private convertToNodes() {
    const jobLength = this.jobs.length;

    this.nodes = this.jobs.map((job, idx) => {
      let type;
      let id;
      if (job.jobType === JobType.LABEL) {
        type = 'labelJobNode';
        id = 'labelJobNode';
      } else if (job.jobType === JobType.QA) {
        type = 'qaJobNode';
        id = `qaJobNode${idx}`;

        if (job.backTo) {
          if (job.backTo in this.qaTurnbackMap) {
            this.qaTurnbackMap[job.backTo].push(job.qaCycleOrder);
          } else {
            this.qaTurnbackMap[job.backTo] = [job.qaCycleOrder];
          }
        }
      }

      return {
        id,
        type,
        data: {
          id,
          flowId: this.workflow.id,
          order: idx,
          job,
          isLastJob: jobLength - 1 === idx,
          workflow: this.workflow,
          qaTurnbackMap: this.qaTurnbackMap,
          onJobDelete: this.onJobDelete,
          onJobTitleClick: this.onJobTitleClick,
          onQAJobTurnbackChange: this.onQAJobTurnbackChange,
        },
        draggable: false,
        position: undefined,
      };
    });

    this.nodes.push({
      id: 'plusNode',
      type: 'jobAddNode',
      data: this.plusNode,
      draggable: false,
      style: {
        color: 'white',
        width: 40,
        height: 40,
        background: '#A0AABC',
        border: 0,
        borderRadius: '50%',
        textAlign: 'center',
        lineHeight: '40px',
      },
      position: undefined,
    });
  }

  private convertToEdges() {
    let cursor = 0;
    while (cursor < this.nodes.length) {
      const [beforeNode, nextNode] = this.nodes.slice(cursor, cursor + 2);
      if (!nextNode) {
        break;
      }

      this.edges.push({
        id: `${beforeNode.id}-${nextNode.id}`,
        source: beforeNode.id,
        target: nextNode.id,
        sourceHandle: HandleId.Right,
        arrowHeadType: ArrowHeadType.Arrow,
      });

      if (
        nextNode.type === 'qaJobNode' &&
        !Object.values(this.qaTurnbackMap)
          .reduce((acc, cur) => {
            acc.push(...cur);
            return acc;
          }, [])
          .includes(nextNode.data.order) &&
        this.workflow.reworkStrategy !== TurnbackStrategy.NOT_TURN_BACK
      ) {
        this.edges.push({
          id: `0-${nextNode.id}-${beforeNode.id}`,
          type: 'customEdge',
          source: nextNode.id,
          target: this.nodes[0].id,
          sourceHandle: HandleId.Top,
          targetHandle: HandleId.Top,
          arrowHeadType: ArrowHeadType.Arrow,
          // animated: true,
        });
      }

      if (
        nextNode.type === 'qaJobNode' &&
        this.workflow.reworkStrategy !== TurnbackStrategy.NOT_TURN_BACK
      ) {
        const { order: targetOrder } = nextNode.data;
        if (targetOrder in this.qaTurnbackMap) {
          this.qaTurnbackMap[targetOrder].forEach((sourceOrder, idx) => {
            this.edges.push({
              id: `${idx + 1}-${this.nodes[sourceOrder].id}-${nextNode.id}`,
              type: 'customEdge',
              source: this.nodes[sourceOrder].id,
              target: nextNode.id,
              sourceHandle: HandleId.Top,
              targetHandle: `${HandleId.Top}${sourceOrder}`,
              arrowHeadType: ArrowHeadType.Arrow,
              // animated: true,
            });
          });
        }
      }

      cursor += 1;
    }
  }

  private appendTurnbackNode() {
    this.nodes.push({
      id: 'turnbackNode',
      type: 'turnbackNode',
      data: {
        text: this.workflow.reworkStrategy,
        workflow: this.workflow,
        onClick: this.onTurnbackNodeClick,
      },
      draggable: false,
      position: {
        x: 100,
        y: 40,
      },
    });
  }

  private appendNodePosition() {
    this.nodes = this.nodes.map((el, idx) => {
      const positionX = FLOW_NODE_WIDTH * idx * 1.2 + 100;

      return {
        ...el,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        style: {
          width: FLOW_NODE_WIDTH,
          height: FLOW_JOB_NODE_HEIGHT,
          ...el.style,
        },
        position: {
          x: positionX,
          y: el.id === 'plusNode' ? 140 : 120,
        },
      };
    });
  }

  public toFlowElements(): Elements<Node | Edge> {
    this.convertToNodes();
    this.convertToEdges();
    this.appendNodePosition();
    if (this.workflow.reworkStrategy) {
      this.appendTurnbackNode();
    }

    return [...this.nodes, ...this.edges];
  }
}
