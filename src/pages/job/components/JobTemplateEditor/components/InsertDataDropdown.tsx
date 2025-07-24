import { DownOutlined, PlusOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button } from "antd";
import { useIntl } from "@umijs/max";

export interface InsertDataDropdownProps {
  itemSelect: (key: string) => void;
  sourceFileHeaders: string[];
}
function InsertDataDropdown({
  itemSelect,
  sourceFileHeaders,
}: InsertDataDropdownProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const transformedHeader = sourceFileHeaders.map((item) => {
    const lowercaseItem = item.toLowerCase();
    const splitItem = lowercaseItem.split(" ");
    const filteredItem = splitItem.filter((val) => !!val);
    if (filteredItem.length === 1) {
      return lowercaseItem;
    }
    return filteredItem.join("_");
  });
  const itemClick = (val: string) => {
    itemSelect(val);
  };
  const menu = (
    <Menu style={{ width: "300px" }}>
      {transformedHeader.map((header) => (
        <Menu.Item key={header}>
          <div onClick={() => itemClick(header)}>
            <PlusOutlined style={{ marginRight: "5px" }} />
            {header}
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown placement="bottomRight" overlay={menu} trigger={["click"]}>
      <Button type="link">
        {formatMessage({ id: "template.insert-data.title" })}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default InsertDataDropdown;
