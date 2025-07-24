import { Select } from "antd";
import { useIntl } from "@umijs/max";
import ToolIcon from "./ToolIcon";
import { Tool } from "./types";
import styles from "./styles.less";

interface ToolSelectorProps {
  value: Tool;
  onChange: (tool: Tool) => void;
}

const { Option } = Select;

const ToolSelector: React.FC<ToolSelectorProps> = ({ value, onChange }) => {
  const { formatMessage } = useIntl();

  return (
    <Select
      className={styles["tool-selector"]}
      dropdownClassName={styles["tool-selector-dropdown"]}
      value={value}
      onChange={onChange}
    >
      {[Tool.RECTANGLE, Tool.POLYGON, Tool.LINE, Tool.DOT].map((t) => (
        <Option key={t} value={t}>
          <ToolIcon tool={t} />
          <span>{formatMessage({ id: `tool.general-image.tool.${t}` })}</span>
        </Option>
      ))}
    </Select>
  );
};

export default ToolSelector;
