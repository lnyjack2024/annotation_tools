import { Menu } from "antd";
import { getLocale, setLocale } from "@umijs/max";
import React from "react";
import classNames from "classnames";
import HeaderDropdown from "../HeaderDropdown";
import moment from "moment";

import { storageGet } from "@/utils/storage";
import { LanguageConfigMap } from "@/types/common";

import styles from "./index.less";

interface SelectLangProps {
  className?: string;
}

moment?.locale(storageGet("umi_locale"));

const SelectLang: React.FC<SelectLangProps> = (props) => {
  const { className } = props;
  const selectedLang = getLocale();

  const langMenu = (
    <Menu
      className={styles.menu}
      selectedKeys={[selectedLang]}
      onClick={({ key }) => {
        setLocale(key, false);
      }}
    >
      {[...LanguageConfigMap.entries()].map(([locale, { label, icon }]) => (
        <Menu.Item key={locale}>
          <span
            role="img"
            className={classNames(styles.flag)}
            aria-label={label}
          >
            {icon}
          </span>
          {label}
        </Menu.Item>
      ))}
    </Menu>
  );
  return (
    <HeaderDropdown overlay={langMenu} placement="bottomRight">
      <span className={classNames(styles.dropDown, className)}>
        {LanguageConfigMap.get(selectedLang).label}
      </span>
    </HeaderDropdown>
  );
};

export default SelectLang;
