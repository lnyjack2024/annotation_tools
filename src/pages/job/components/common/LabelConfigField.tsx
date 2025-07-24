import { useState } from "react";
import { Button } from "antd";
import FormConfigModal from "./FormConfigModal";
import { useIntl } from "umi";

interface LabelConfigFieldProps {
  value?: string;
  onChange?: (value?: string) => void;
}

/**
 * label config field (can be used in antd form)
 */
function LabelConfigField({ value, onChange }: LabelConfigFieldProps) {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  return (
    <>
      <span style={{ color: "#7A869A", marginRight: 12 }}>
        {formatMessage({ id: value ? "COMMON_SETTED" : "COMMON_EMPTY" })}
      </span>
      <Button type="primary" ghost onClick={() => setEditing(true)}>
        {formatMessage({ id: "COMMON_SET" })}
      </Button>
      <FormConfigModal
        open={editing}
        config={value}
        onSave={(config) => {
          if (onChange) {
            onChange(config);
          }
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
      <input data-easyform="true" style={{ display: "none" }} value={value} />
    </>
  );
}

export default LabelConfigField;
