import { useState } from "react";
import { Button, Modal } from "antd";
import { useIntl } from "@umijs/max";
import FormAttribute from "@/pages/job/components/JobTemplateEditor/components/FormAttribute";

interface LabelConfigFieldProps {
  value?: string;
  onChange?: (value?: string) => void;
}

/**
 * label config field (can be used in antd form)
 */
const LabelConfigField: React.FC<LabelConfigFieldProps> = ({
  value,
  onChange,
}) => {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  return (
    <>
      <span style={{ color: "#7A869A", marginRight: 12 }}>
        {formatMessage({
          id: value
            ? "tool.general-image.config.been-set"
            : "tool.general-image.config.empty",
        })}
      </span>
      <Button onClick={() => setEditing(true)}>
        {formatMessage({ id: "tool.general-image.config.set" })}
      </Button>
      <Modal
        destroyOnClose
        width={960}
        bodyStyle={{ padding: "45px 8px 8px" }}
        visible={editing}
        footer={null}
        onCancel={() => setEditing(false)}
      >
        <FormAttribute
          config={value}
          ontologySyncDisabled
          onSave={(config) => {
            if (onChange) {
              onChange(config);
            }
            setEditing(false);
          }}
        />
      </Modal>
    </>
  );
};

export default LabelConfigField;
