import { forwardRef, useContext, useEffect, useImperativeHandle } from "react";
import { useIntl } from "umi";
import { Button, Form, Input, Select, Popover } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { AppContext } from "@/pages/project/template-center/EmbeddedTemplateCreation";
import TinymceEditor from "@/components/TinymceEditor";
import { EDITOR_IMG_UPLOAD_API } from "@/utils/constants";
import { DataType } from "@/types/dataset";

type Props = {
  onNext: () => void;
  activeKey: string;
};
export interface BasicInfoHandle {
  updateValues: () => Promise<string>;
}

const BasicInfo = forwardRef<BasicInfoHandle, Props>(({ onNext }, ref) => {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();
  const { templateInfo, dispatch } = useContext(AppContext);

  const updateValues = () => {
    return new Promise<string>((resolve, reject) => {
      form.validateFields().then(
        (values) => {
          dispatch?.({ type: "baseInfo", payload: values });
          setTimeout(() => {
            resolve("success");
          }, 0);
        },
        () => {
          reject("error");
        }
      );
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      updateValues,
    }),
    [form]
  );

  useEffect(() => {
    if (templateInfo) {
      // const { supportedLowestIOSVersion, supportedLowestAndroidVersion } = templateInfo;
      const newValues: any = {
        title: templateInfo.title,
        instruction: templateInfo.instruction,
        dataType: templateInfo.dataType,
        isSupportedByApp: templateInfo.isSupportedByApp,
      };
      // if (supportedLowestIOSVersion) {
      //   newValues.supportedLowestIOSVersion = supportedLowestIOSVersion;
      // }
      // if (supportedLowestAndroidVersion) {
      //   newValues.supportedLowestAndroidVersion = supportedLowestAndroidVersion;
      // }
      form.setFieldsValue(newValues);
    }
  }, [templateInfo]);

  return (
    <>
      <div className="common-panel basic-info-panel">
        <Form
          form={form}
          labelCol={{ sm: 6, lg: 5, xl: 4, xxl: 3 }}
          wrapperCol={{ sm: 18, lg: 19, xl: 19, xxl: 20 }}
          colon={false}
        >
          <Form.Item
            name="title"
            label={formatMessage({ id: "TEMPLATE_TITLE" })}
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
            label={formatMessage({ id: "TEMPLATE_DATA_TYPE" })}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select disabled>
              {Object.values(DataType).map((dataType) => (
                <Select.Option key={dataType} value={dataType}>
                  {formatMessage({ id: `TEMPLATE_DATA_TYPE_${dataType}` })}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {/* <Form.Item
            name="isSupportedByApp"
            label={
              <>
                {formatMessage({ id: 'TEMPLATE_SUPPORT_APP' })}
                <Popover
                  placement="top"
                  content={formatMessage({ id: 'TEMPLATE_SUPPORT_APP_TIP' })}
                >
                  <InfoCircleOutlined />
                </Popover>
              </>
            }
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value>{formatMessage({ id: 'COMMON_YES' })}</Radio>
              <Radio value={false}>{formatMessage({ id: 'COMMON_NO' })}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            shouldUpdate={(prevValues, curValues) =>
              prevValues.isSupportedByApp !== curValues.isSupportedByApp
            }
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue('isSupportedByApp') && (
                <Form.Item
                  wrapperCol={{ sm: { span: 12, offset: 8 }, xl: { span: 18, offset: 6 }, xxl: { span: 19, offset: 5 } }}
                >
                  <p>{formatMessage({ id: 'TEMPLATE_APP_VERSION_TIP' })}</p>
                  <div style={{ display: 'flex' }}>
                    <Form.Item
                      name="supportedLowestIOSVersion"
                      label="iOS"
                      style={{ marginRight: 12 }}
                      rules={[
                        {
                          pattern: /^v\d.\d.\d$/,
                          message: formatMessage({ id:
                            'TEMPLATE_APP_VERSION_WARNING' }
                          ),
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="supportedLowestAndroidVersion"
                      label="Android"
                      rules={[
                        {
                          pattern: /^v\d.\d.\d$/,
                          message: formatMessage({ id:
                            'TEMPLATE_APP_VERSION_WARNING' }
                          ),
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </div>
                </Form.Item>
              )
            }
          </Form.Item> */}

          <Form.Item
            name="instruction"
            label={
              <>
                {formatMessage({ id: "TEMPLATE_INSTRUCTION" })}
                <Popover
                  placement="top"
                  content={formatMessage({ id: "TEMPLATE_INSTRUCTION_TIP" })}
                >
                  <InfoCircleOutlined />
                </Popover>
              </>
            }
            rules={[
              {
                required: true,
              },
            ]}
          >
            <TinymceEditor height={380} imageApi={EDITOR_IMG_UPLOAD_API} />
          </Form.Item>
        </Form>
      </div>
      <div className="common-footer">
        <Button
          type="primary"
          onClick={(e) => {
            e.preventDefault();
            onNext();
          }}
        >
          {formatMessage({ id: "COMMON_NEXT_STEP" })}
        </Button>
      </div>
    </>
  );
});

export default BasicInfo;
