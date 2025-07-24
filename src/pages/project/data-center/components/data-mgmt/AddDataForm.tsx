import { Button, Form, Select, Upload, message, Input, Row, Col } from "antd";
import type { FormInstance } from "antd/lib/form/hooks/useForm";
import type { RcFile } from "antd/es/upload/interface";
import { useIntl } from "@umijs/max";

import { DataType, SourceType } from "@/types/dataset";
import { checkProjectDataPoolBatchName } from "@/services/project";
import { useEffect, useState } from "react";
import DataTypeDescriptionModal from "./DataTypeDescriptionModal";
import { formatBytes } from "@/utils";
interface AddDataFormProp {
  form: FormInstance;
  fileAccept: string;
  projectId?: string;
  isPushData?: boolean;
  sourceType: SourceType;
}

const MaxFileSizeBySourceType = {
  [SourceType.UPLOADED]: 100 * Math.pow(1024, 2),
  [SourceType.CSV_ZIP]: 100 * Math.pow(1024, 2),
  [SourceType.ORIGINAL_UPLOADED]: Math.pow(1024, 3),
};

export default function AddDataForm({
  form,
  fileAccept,
  projectId,
  isPushData = false,
  sourceType,
}: AddDataFormProp) {
  const { formatMessage } = useIntl();
  const [dataTypeModal, setDataTypeModal] = useState<DataType>();
  const isCsvZip = sourceType === SourceType.CSV_ZIP;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.file;
  };

  function beforeUpload(file: RcFile) {
    if (file.size >= MaxFileSizeBySourceType[sourceType]) {
      message.error(
        formatMessage(
          { id: "common.fileSizeExceeded" },
          { size: formatBytes(MaxFileSizeBySourceType[sourceType]) }
        )
      );
      form.resetFields(["file"]);
      return Upload.LIST_IGNORE;
    }
    if (!isPushData) {
      form.setFieldsValue({
        batchName: file.name.slice(0, -4),
      });
    }
    return false;
  }

  useEffect(() => {
    isPushData && form.validateFields(["dataType"]);
  }, [isPushData]);

  return (
    <Form form={form} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item
        label={formatMessage({
          id: "data.batch.num",
        })}
        name="batchNum"
        hidden={!isPushData}
      >
        <Input disabled />
      </Form.Item>
      <Form.Item
        name="dataType"
        label={formatMessage({
          id: "project.detail.data-center.add-data.data-type",
        })}
        rules={[
          {
            required: true,
            message: formatMessage({
              id: "project.detail.data-center.add-data.data-type.required",
            }),
          },
          {
            validateTrigger: ["onChange"],
            validator: async (_, value) => {
              if (
                sourceType === SourceType.ORIGINAL_UPLOADED &&
                value === DataType.TEXT
              ) {
                return Promise.reject(
                  formatMessage({
                    id: "project.detail.data-center.upload.text.error",
                  })
                );
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Select disabled={isPushData}>
          {[
            DataType.TEXT,
            DataType.IMG,
            DataType.AUDIO,
            DataType.VIDEO,
            DataType.LIDAR,
          ].map((item) => (
            <Select.Option value={item} key={item}>
              {formatMessage({ id: `data.type.${item}` })}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.dataType !== currentValues.dataType ||
          prevValues.file !== currentValues.file
        }
      >
        {(control: FormInstance) => {
          const dataType = control.getFieldValue("dataType");
          const buttonDisabled = !(dataType && dataType !== DataType.TEXT);
          return (
            <div className="ant-form-item">
              <Row className="ant-row ant-form-item-row">
                <Col
                  span={8}
                  className="ant-col ant-col-8 ant-form-item-label"
                  style={{ textAlign: "end" }}
                >
                  <label className="ant-form-item-required">
                    {formatMessage({
                      id: "project.detail.data-center.add-data.select-file",
                    })}
                    ：
                  </label>
                </Col>
                <Col
                  span={16}
                  className="ant-col ant-col-16 ant-form-item-control"
                >
                  <div style={{ display: "flex" }}>
                    <Form.Item
                      name="file"
                      extra={formatMessage(
                        {
                          id: "project.detail.data-center.add-data.select-file.zip.extra",
                        },
                        {
                          type: fileAccept.slice(1),
                          size: formatBytes(
                            MaxFileSizeBySourceType[sourceType]
                          ),
                        }
                      )}
                      getValueFromEvent={normFile}
                      rules={[
                        {
                          required: true,
                          message: formatMessage({
                            id: "data.action.upload.required",
                          }),
                        },
                      ]}
                    >
                      <Upload
                        accept={fileAccept}
                        maxCount={1}
                        beforeUpload={beforeUpload}
                      >
                        <Button type="dashed">
                          {formatMessage({ id: "data.action.upload" })}
                        </Button>
                      </Upload>
                    </Form.Item>
                    {sourceType === SourceType.ORIGINAL_UPLOADED && (
                      <div style={{ display: "flex" }}>
                        <Button
                          type="link"
                          disabled={buttonDisabled}
                          onClick={() => {
                            setDataTypeModal(dataType);
                          }}
                        >
                          {formatMessage({
                            id: "project.detail.data-center.data-type",
                          })}
                        </Button>
                        <a
                          href={`https://onpremise-platform-assets.oss-cn-zhangjiakou.aliyuncs.com/template/${dataType}.zip`}
                        >
                          <Button type="link" disabled={buttonDisabled}>
                            {formatMessage({
                              id: "project.detail.data-center.template-download",
                            })}
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          );
        }}
      </Form.Item>
      <Form.Item
        label={formatMessage({
          id: "data.batch.name",
        })}
        name="batchName"
        extra={
          isCsvZip &&
          formatMessage({
            id: "project.detail.data-center.add-data.select-file.batchName.extra",
          })
        }
        rules={[
          {
            validateTrigger: ["onChange"],
            validator: async (_, value) => {
              if (isPushData || isCsvZip) {
                return Promise.resolve();
              }
              if (!value) {
                return Promise.reject(
                  formatMessage({
                    id: "data.action.batchName.required",
                  })
                );
              }
              if (value.length > 100) {
                return Promise.reject(
                  formatMessage({
                    id: "55075",
                  })
                );
              }

              const { data, status } = await checkProjectDataPoolBatchName({
                projectId,
                batchName: value,
              });
              if (!data) {
                return Promise.reject(
                  formatMessage({
                    id: status.toString(),
                  })
                );
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input disabled={isCsvZip || isPushData} />
      </Form.Item>
      {dataTypeModal && (
        <DataTypeDescriptionModal
          dataType={dataTypeModal}
          onCancel={() => {
            setDataTypeModal(null);
          }}
        />
      )}
    </Form>
  );
}
