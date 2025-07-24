import { Modal } from "antd";
import { useIntl } from "@umijs/max";

import { DataType } from "@/types/dataset";

interface DataTypeDescriptionModalProp {
  dataType: DataType;
  onCancel: () => void;
}

export default function DataTypeDescriptionModal({
  dataType,
  onCancel,
}: DataTypeDescriptionModalProp) {
  const { formatMessage } = useIntl();

  return (
    <Modal
      open={!!dataType}
      footer={null}
      title={formatMessage({
        id: `project.detail.data-center.data-type.${dataType}`,
      })}
      onCancel={onCancel}
    >
      <span style={{ whiteSpace: "pre-wrap" }}>
        {formatMessage({
          id: `project.detail.data-center.data-type.desc.${dataType}`,
        })}
      </span>
    </Modal>
  );
}
