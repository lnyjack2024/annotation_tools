import React, { useEffect } from "react";
import { Button, Form, Input, Select } from "antd";
import { useIntl } from "@umijs/max";
import moment from "moment";

import TinymceEditor from "@/components/TinymceEditor";
import type { TemplateInfoV2 } from "@/types/template";
import { TemplateType } from "@/types/template";
import { DataType } from "@/types/dataset";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { EDITOR_IMG_UPLOAD_API } from "@/utils";

type Props = {
  templateInfo: TemplateInfoV2;
  visible: boolean;
  onNext: (values: any) => void;
};

const FormLayout = {
  labelCol: { span: 3 },
  wrapperCol: { span: 20 },
};

const Step1: React.FC<Props> = ({ templateInfo, visible, onNext }) => {
  const [form] = Form.useForm();
  const { formatMessage } = useIntl();
  const { query } = useLocationWithQuery();

  useEffect(() => {
    if (templateInfo) {
      form.setFieldsValue({
        title:
          query.action === "CREATE"
            ? `${templateInfo.title} [${moment().format(
                "YYYY-MM-DD hh:mm:ss"
              )}]`
            : templateInfo.title,
        instruction: templateInfo.instruction,
        dataType: templateInfo.dataType,
        isSupportedByApp: templateInfo.isSupportedByApp,
        supportedLowestIOSVersion: templateInfo.supportedLowestIOSVersion,
        supportedLowestAndroidVersion:
          templateInfo.supportedLowestAndroidVersion,
      });
    }
  }, [templateInfo]);

  return (
    <div style={visible ? undefined : { display: "none" }}>
      <Form form={form} {...FormLayout}>
        <Form.Item
          name="title"
          label={formatMessage({ id: "template-title" })}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="dataType"
          label={formatMessage({
            id: "project.detail.data-center.filter.data-type",
          })}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select disabled={templateInfo.type !== TemplateType.CUSTOM}>
            {Object.values(DataType).map((dataType) => (
              <Select.Option key={dataType} value={dataType}>
                {formatMessage({ id: `data.type.${dataType}` })}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="instruction"
          label={formatMessage({ id: "template-instruction" })}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <TinymceEditor height={380} imageApi={EDITOR_IMG_UPLOAD_API} />
        </Form.Item>
      </Form>
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}
      >
        <Button
          type="primary"
          style={{ width: 80 }}
          onClick={(e) => {
            e.preventDefault();
            form
              .validateFields()
              .then((values) => {
                onNext(values);
              })
              .catch((err) => {
                console.log(err);
              });
          }}
        >
          {formatMessage({ id: "common.next-step" })}
        </Button>
      </div>
    </div>
  );
};

export default Step1;
