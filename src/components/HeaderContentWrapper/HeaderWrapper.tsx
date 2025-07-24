import type { ReactNode } from "react";
import React from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { history as router } from "@umijs/max";
import globalStyles from "@/global.less";
import { PageHeader } from "@ant-design/pro-components";

export interface HeaderWrapperProps {
  onBack?: () => void;
  backTitle?: string | ReactNode;
  title: string | ReactNode;
  content?: ReactNode;
  actions?: ReactNode;
  titleIcon?: ReactNode;
}

export default function HeaderWrapperComponent({
  onBack,
  title,
  content,
  actions,
  backTitle,
  titleIcon,
}: HeaderWrapperProps) {
  const back = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.goBack();
  };

  const icon = () => {
    if (typeof backTitle === "string") {
      return (
        <>
          <ArrowLeftOutlined /> {backTitle}
        </>
      );
    }

    if (React.isValidElement(backTitle)) {
      return backTitle;
    }

    return null;
  };

  return (
    <PageHeader
      className={globalStyles["page-header"]}
      ghost={false}
      backIcon={icon()}
      onBack={() => back()}
      title=" "
    >
      {content ? (
        <>
          <div
            className={globalStyles["page-title-container"]}
            {...(!icon() && { style: { marginTop: 32 } })}
          >
            <span className={globalStyles["page-title"]}>
              {titleIcon && (
                <span className={globalStyles["title-icon"]}>{titleIcon}</span>
              )}
              {title}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflowX: "auto",
            }}
          >
            <span>{content}</span>
            <span>{actions}</span>
          </div>
        </>
      ) : (
        <div
          className={globalStyles["page-title-container"]}
          {...(!icon() && { style: { marginTop: 32 } })}
        >
          <span className={globalStyles["page-title"]}>
            {titleIcon && (
              <span className={globalStyles["title-icon"]}>{titleIcon}</span>
            )}
            {title}
          </span>
          <span>{actions}</span>
        </div>
      )}
    </PageHeader>
  );
}
