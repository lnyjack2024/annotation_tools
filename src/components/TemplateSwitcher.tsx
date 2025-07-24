import { FormOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import { useIntl } from "@umijs/max";
import type { ProjectTemplate } from "@/types/v3";
import { Granularity } from "@/types/dataAudit";

type Props = {
  templateId: string;
  templates: ProjectTemplate[];
  onChange?: (newTemplateId: string) => void;
  loading?: boolean;
  isInterimReviseJob?: boolean;
  granularity?: Granularity;
};

const TemplateSwitcher: React.FC<Props> = ({
  templates,
  templateId,
  onChange,
  loading = false,
}) => {
  const { formatMessage } = useIntl();

  const [modalVisible, setModalVisible] = useState(false);
  const [targetTemplateId, setTargetTemplateId] = useState<string>(templateId);

  const currentTemplate = templates.find((item) => item.id === templateId);

  useEffect(() => {
    setTargetTemplateId(templateId);
  }, [templateId]);

  return (
    <>
      <div
        onClick={(e) => {
          e.preventDefault();
          setModalVisible(true);
        }}
        style={{
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        <span>{currentTemplate?.title}</span>
        <FormOutlined style={{ color: "#227A7A", paddingLeft: 4 }} />
      </div>
      <Modal
        title={formatMessage({ id: "common.template.select" })}
        className="custom-modal"
        visible={modalVisible}
        maskClosable={false}
        okText={formatMessage({ id: "common.confirm" })}
        onCancel={() => {
          setTargetTemplateId(templateId);
          setModalVisible(false);
        }}
        okButtonProps={{
          disabled: targetTemplateId === templateId,
          loading,
        }}
        onOk={() => {
          if (onChange) {
            onChange(targetTemplateId);
          }
          setModalVisible(false);
        }}
      >
        <Select
          style={{ width: "100%" }}
          value={targetTemplateId}
          onSelect={(tmplId: string) => {
            setTargetTemplateId(tmplId);
          }}
        >
          {templates.map((tmpl) => (
            <Select.Option key={tmpl.id} value={tmpl.id}>
              {tmpl.title}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </>
  );
};

export default TemplateSwitcher;
