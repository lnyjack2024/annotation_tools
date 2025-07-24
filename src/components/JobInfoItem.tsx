import { useIntl } from "@umijs/max";
import type { ReactNode } from "react";

import styles from "./JobInfoItem.less";

export interface JobInfoItemProp {
  key?: string;
  icon?: ReactNode;
  title: string | ReactNode;
  content?: string | ReactNode;
}

export default function JobInfoItem({ icon, title, content }: JobInfoItemProp) {
  const { formatMessage } = useIntl();
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        {icon}
        {title}
      </div>
      <div className={styles.content}>
        {content || formatMessage({ id: "common.nothing" })}
      </div>
    </div>
  );
}
