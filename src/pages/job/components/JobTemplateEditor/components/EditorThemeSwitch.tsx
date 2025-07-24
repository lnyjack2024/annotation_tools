import React from "react";
import { Button, Dropdown, Menu } from "antd";
import { useIntl } from "@umijs/max";
import { DownOutlined } from "@ant-design/icons";

import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-monokai";

const EditorThemes = [
  "tomorrow",
  "dracula",
  "monokai",
  "github",
  "solarized_light",
];

type Props = {
  onThemeChange: (theme: string) => void;
};

const EditorThemeSwitch: React.FC<Props> = ({ onThemeChange }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const menu = (
    <Menu style={{ width: "300px" }}>
      {EditorThemes.map((theme) => (
        <Menu.Item key={theme}>
          <div onClick={() => onThemeChange(theme)}>{theme}</div>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown placement="bottomRight" overlay={menu} trigger={["click"]}>
      <Button type="link">
        {formatMessage({ id: "template.theme-change" })}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default EditorThemeSwitch;
