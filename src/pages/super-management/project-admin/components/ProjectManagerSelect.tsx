import React from "react";
import type { TenantPM } from "@/types/project";
import { Select } from "antd";
import { useIntl } from "@umijs/max";

type Props = {
  pms: TenantPM[];
  width?: string | number;
  onChange?: (emailWithPrefix: string) => void;
};
const ProjectManagerSelect: React.FC<Props> = ({
  pms = [],
  onChange,
  width,
}) => {
  const { formatMessage } = useIntl();
  const handleChange = (name: string) => {
    if (onChange) {
      onChange(name);
    }
  };

  return (
    <Select
      showSearch
      style={{ width: width || "100%" }}
      placeholder={formatMessage({ id: "project-access.model.select" })}
      onChange={handleChange}
    >
      {pms.map((pm) => (
        <Select.Option key={pm.uniqueName} value={pm.uniqueName}>
          {pm.uniqueName}
        </Select.Option>
      ))}
    </Select>
  );
};

export default ProjectManagerSelect;
