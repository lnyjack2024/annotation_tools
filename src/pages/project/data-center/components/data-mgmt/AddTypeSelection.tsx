import { Col, Row, Typography } from "antd";
import { SourceType } from "@/types/dataset";
import styles from "@/pages/job/styles.less";
import { useIntl } from "@umijs/max";
import {
  FileOutlined,
  InfoCircleOutlined,
  FileZipOutlined,
} from "@ant-design/icons";

interface AddTypeSelectionComponentProp {
  addTypes: SourceType[];
  select: (type: SourceType) => void;
}

export default function AddTypeSelectionComponent({
  addTypes,
  select,
}: AddTypeSelectionComponentProp) {
  const { formatMessage } = useIntl();

  const defaultTypes = [
    // {
    //   key: SourceType.PRE_PROCESSED,
    //   label: formatMessage({
    //     id: 'project.detail.data-center.add-data.select-type.pre_processed',
    //   }),
    //   icon: <FolderOutlined className={styles.icon} />,
    //   tip: formatMessage({
    //     id: 'project.detail.data-center.add-data.select-type.pre_processed.tip',
    //   }),
    //   disabled: true,
    // },
    {
      key: SourceType.ORIGINAL_UPLOADED,
      label: formatMessage({
        id: "project.detail.data-center.add-data.select-type.original_uploaded",
      }),
      icon: <FileZipOutlined className={styles.icon} />,
      tip: formatMessage({
        id: "project.detail.data-center.add-data.select-type.original_uploaded.tip",
      }),
    },
    {
      key: SourceType.UPLOADED,
      label: formatMessage({
        id: "project.detail.data-center.add-data.select-type.uploaded",
      }),
      icon: <FileOutlined className={styles.icon} />,
      tip: formatMessage({
        id: "project.detail.data-center.add-data.select-type.uploaded.tip",
      }),
    },
    {
      key: SourceType.CSV_ZIP,
      label: formatMessage({
        id: "project.detail.data-center.add-data.select-type.csv_zip",
      }),
      icon: <FileZipOutlined className={styles.icon} />,
      tip: formatMessage({
        id: "project.detail.data-center.add-data.select-type.csv_zip.tip",
      }),
    },
  ];

  const types = defaultTypes.filter((type) => addTypes.includes(type.key));

  return (
    <>
      <Row>
        {types.map(({ key, label, icon, tip }) => (
          <Col
            key={key}
            span={24 / types.length}
            style={{ textAlign: "center" }}
          >
            <button
              type="button"
              className={styles.jobTypeContainer}
              onClick={() => select(key)}
              style={{
                height: 230,
                cursor: "pointer",
              }}
            >
              <div>{icon}</div>
              <Typography.Text strong>{label}</Typography.Text>
              <div className="margin-top-3 text-size-1">
                <InfoCircleOutlined className="margin-right-1" />
                <Typography.Text type="secondary">{tip}</Typography.Text>
              </div>
            </button>
          </Col>
        ))}
      </Row>
    </>
  );
}
