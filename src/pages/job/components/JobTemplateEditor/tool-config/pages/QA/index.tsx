import { forwardRef, useContext, useEffect, useImperativeHandle } from "react";
import { useIntl } from "umi";
import { Button, Form, Input, Popover } from "antd";
import { InfoCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { AppContext } from "@/pages/project/template-center/EmbeddedTemplateCreation";

interface Props {
  onFinish: () => void;
  onPrev: () => void;
}
export interface QAHandle {
  updateValues: () => Promise<string>;
}

const QA = forwardRef<QAHandle, Props>(({ onFinish, onPrev }, ref) => {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();
  const { templateInfo, dispatch } = useContext(AppContext);

  const updateValues = () => {
    return new Promise<string>((resolve, reject) => {
      form.validateFields().then(
        (values) => {
          let questionTypeUnique: string[] = [];
          if (values.questionType) {
            const questionTypeTrim = values.questionType.map((i: string) =>
              i.trim()
            );
            questionTypeUnique = Array.from(new Set(questionTypeTrim));
          }
          dispatch?.({
            type: "baseInfo",
            payload: { questionType: questionTypeUnique },
          });
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
    form.setFieldValue("questionType", templateInfo?.questionType);
  }, [templateInfo]);

  return (
    <>
      <div className="common-wrapper">
        <Form form={form} colon={false}>
          <div className="form-block">
            <div className="form-title form-title-inline">
              {formatMessage({ id: "TEMPLATE_QA_PRESET_REJECT_REASON" })}
              <Popover
                placement="top"
                content={formatMessage({
                  id: "TEMPLATE_QA_PRESET_REJECT_REASON_TIP",
                })}
              >
                <InfoCircleOutlined />
              </Popover>
            </div>
            <div className="common-panel">
              <Form.List name="questionType">
                {(fields, { add, remove }, { errors }) => (
                  <>
                    {fields.map((field) => (
                      <Form.Item key={field.key}>
                        <Form.Item
                          {...field}
                          validateTrigger={["onBlur", "onChange"]}
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: formatMessage({
                                id: "TEMPLATE_QA_PRESET_REJECT_REASON_REQUIRED",
                              }),
                            },
                          ]}
                          noStyle
                        >
                          <Input
                            autoFocus
                            placeholder={formatMessage({
                              id: "COMMON_PLACEHOLDER",
                            })}
                            style={{ width: 520, marginRight: 12 }}
                          />
                        </Form.Item>
                        <CloseOutlined
                          className="dynamic-delete-button"
                          onClick={() => remove(field.name)}
                        />
                      </Form.Item>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        style={{ width: 520 }}
                      >
                        {formatMessage({ id: "COMMON_ADD_BY_CLICK" })}
                      </Button>
                      <Form.ErrorList errors={errors} />
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </div>
          </div>
        </Form>
      </div>
      <div className="common-footer">
        <Button
          style={{ marginRight: 16 }}
          onClick={(e) => {
            e.preventDefault();
            onPrev?.();
          }}
        >
          {formatMessage({ id: "COMMON_PREV_STEP" })}
        </Button>
        <Button
          type="primary"
          onClick={(e) => {
            e.preventDefault();
            onFinish?.();
          }}
        >
          {formatMessage({ id: "COMMON_SAVE_CLOSE" })}
        </Button>
      </div>
    </>
  );
});

export default QA;
