import { Space, Descriptions, Button, message } from "antd";
import { ProjectDataDetail } from "@/services/project";
import { useIntl } from "@umijs/max";
import ColorPoint from "@/pages/project/components/ColorPoint";
import { CopyOutlined } from "@ant-design/icons";
import { DATA_STATE_COLORS } from "./DataList";
import { copyTextToClipboard } from "@/utils";

type RecordDataInfoProps = {
  recordData: ProjectDataDetail;
};

function RecordDataInfo({ recordData }: RecordDataInfoProps) {
  const { formatMessage } = useIntl();
  const {
    batchNum,
    // auditNum,
    dataType,
    flowName,
    cycle,
    contributor,
    state,
    // auditState,
    source,
  } = recordData || {};

  const originData = source
    ? Object.keys(source)
        .map((key) => ({ title: key, dataIndex: key, value: source[key] }))
        .filter((item) => item.dataIndex !== "id")
    : [];

  const copy = (copyContent: string) => {
    if (copyTextToClipboard(copyContent)) {
      message.success(formatMessage({ id: "worker.actions.copy-success" }));
    }
  };

  return (
    <div style={{ paddingLeft: 24, display: "flex", flexDirection: "column" }}>
      <Space direction="vertical" size="middle">
        <Descriptions
          title={formatMessage({
            id: "project.detail.record-detail.data.info",
          })}
          column={1}
          labelStyle={{ color: "#7A869A" }}
          contentStyle={{ color: "#42526E" }}
        >
          <Descriptions.Item
            label={formatMessage({
              id: "project.detail.data-center.filter.data-type",
            })}
          >
            {formatMessage({
              id: `project.detail.data-center.data-type.${dataType?.toLowerCase()}`,
            })}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "project.detail.data-center.filter.batch",
            })}
          >
            {batchNum}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "project.detail.data-center.filter.current-node",
            })}
          >
            {flowName ? (
              <>
                <span>{flowName}</span>
                <span style={{ marginLeft: 8 }}>
                  {cycle
                    ? `${formatMessage({ id: "qa-job.type" })}${cycle}`
                    : `${formatMessage({ id: "labeling-job.type" })}1`}
                </span>
              </>
            ) : (
              formatMessage({ id: "common.nothing-symbol" })
            )}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({
              id: "project.detail.data-center.filter.data-status",
            })}
          >
            <span>
              <ColorPoint color={DATA_STATE_COLORS[state]} />
              {formatMessage({
                id: `project.detail.data-center.data-state.${state?.toLowerCase()}`,
              })}
            </span>
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({ id: "common.current-worker" })}
          >
            {contributor?.name ||
              formatMessage({ id: "common.nothing-symbol" })}
          </Descriptions.Item>
          {/*<Descriptions.Item*/}
          {/*  label={formatMessage({*/}
          {/*    id: 'project.detail.data-center.filter.audit-status',*/}
          {/*  })}*/}
          {/*>*/}
          {/*  {auditState ? (*/}
          {/*    <span>*/}
          {/*      <ColorPoint color={DATA_STATE_COLORS[auditState]} />*/}
          {/*      {formatMessage({*/}
          {/*        id: `job-detail.audit.record.status.${auditState}`,*/}
          {/*      })}*/}
          {/*      {typeof auditNum === 'number' && `(No.${auditNum})`}*/}
          {/*    </span>*/}
          {/*  ) : (*/}
          {/*    formatMessage({ id: 'common.nothing-symbol' })*/}
          {/*  )}*/}
          {/*</Descriptions.Item>*/}
        </Descriptions>
        <Descriptions
          title={formatMessage({
            id: "project.detail.data-center.column.origin-data",
          })}
          column={1}
          labelStyle={{ color: "#42526E", fontWeight: 600 }}
          contentStyle={{ color: "#7A869A" }}
          layout="vertical"
          colon={false}
        >
          {originData.map((data) => (
            <Descriptions.Item
              key={data.title}
              style={{ paddingBottom: 8 }}
              label={
                <span>
                  {data.title}
                  <Button
                    type="link"
                    icon={<CopyOutlined />}
                    onClick={() => copy(data.value)}
                  />
                </span>
              }
            >
              {data.value}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Space>
    </div>
  );
}

export default RecordDataInfo;
