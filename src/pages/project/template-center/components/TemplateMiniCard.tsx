import React from "react";
import { Button } from "antd";
import { useIntl } from "@umijs/max";

import { TemplateType } from "@/types/template";

import styles from "./styles.less";

type Props = {
  bgImage: string;
  templateId: string;
  type: TemplateType;
  onTemplatePreview?: (templateId: string) => void;
  onTemplateSelect?: (templateId: string) => void;
};

const TemplateMiniCard: React.FC<Props> = ({
  templateId,
  type,
  bgImage,
  onTemplatePreview,
  onTemplateSelect,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div
      className={styles["template-mini-card"]}
      style={{
        backgroundImage: `url("${bgImage}")`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        width: 300,
        height: 200,
      }}
    >
      <div className={styles.action}>
        {type !== TemplateType.CUSTOM && (
          <Button
            style={{ marginRight: 12 }}
            onClick={(e) => {
              e.preventDefault();
              onTemplatePreview?.(templateId);
            }}
          >
            {formatMessage({ id: "common.preview" })}
          </Button>
        )}
        <Button
          type="primary"
          onClick={(e) => {
            e.preventDefault();
            onTemplateSelect?.(templateId);
          }}
        >
          {type === TemplateType.CUSTOM
            ? formatMessage({ id: "use-custom-template" })
            : formatMessage({ id: "template.list.take" })}
        </Button>
      </div>
    </div>
  );
};

export default TemplateMiniCard;
