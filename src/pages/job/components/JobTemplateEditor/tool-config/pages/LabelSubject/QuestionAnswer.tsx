import {
  useEffect,
  useContext,
  forwardRef,
  useMemo,
  useImperativeHandle,
} from "react";
import { Form, Button, Input, Switch, Radio, message, Popover } from "antd";
import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useIntl } from "umi";
import LabelConfigField from "@/pages/job/components/common/LabelConfigField";
import InputTagCom from "@/pages/job/components/common/InputTagCom";
import { AppContext } from "@/pages/project/template-center/EmbeddedTemplateCreation";
import { RankingTypeOptions } from "@/utils/consts";
import { RankingType } from "../../types/template";

const rankingOptionsLabel = {
  [RankingType.SCORE]: "TEMPLATE_SUBJECT_COMMENT_DEMENSION",
  [RankingType.MARK]: "TEMPLATE_SUBJECT_ERROR_TYPE",
};

type Props = {
  onNext: () => void;
  onPrev: () => void;
};
export interface LabelSubjectQuestionAnswerHandle {
  updateValues: () => Promise<string>;
}

const LabelSubjectQuestionAnswer = forwardRef<
  LabelSubjectQuestionAnswerHandle,
  Props
>(({ onNext, onPrev }, ref) => {
  const { formatMessage } = useIntl();

  const [form] = Form.useForm();
  const rankingType: RankingType | undefined = Form.useWatch(
    "ranking_type",
    form
  );

  const { templateInfo, dispatch } = useContext(AppContext);

  useImperativeHandle(ref, () => ({
    updateValues,
  }));

  useEffect(() => {
    if (templateInfo?.parsedAttributes) {
      const { parsedAttributes } = templateInfo;
      const {
        sortable,
        editable,
        addible,
        add_model,
        add_model_flag,
        add_limit_flag,
        add_limit,
        add_limit_operator,
        ranking,
        ranking_type,
        ranking_options,
        subjects,
        attributes_config,
        item_attributes_config,
      } = parsedAttributes;
      form.setFieldsValue({
        sortable,
        editable,
        addible,
        add_model,
        add_model_flag,
        add_limit_flag,
        add_limit,
        add_limit_operator,
        ranking,
        ranking_type,
        ranking_options,
        subjects,
        attributes_config,
        item_attributes_config,
      });
    }
  }, [templateInfo?.parsedAttributes]);

  const updateValues = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      form.validateFields().then(
        (values) => {
          const {
            sortable,
            editable,
            addible,
            ranking,
            attributes_config,
            item_attributes_config,
          } = values;
          if (
            !(
              sortable ||
              editable ||
              addible ||
              ranking ||
              attributes_config ||
              item_attributes_config
            )
          ) {
            message.error(
              formatMessage({ id: "TEMPLATE_SUBJECT_ANSWER_ERROR" })
            );
            reject("error");
            return;
          }
          dispatch?.({ type: "parsedAttributes", payload: values });
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

  const getRankingOptionsLabel = useMemo(() => {
    return rankingType && rankingOptionsLabel[rankingType]
      ? formatMessage({ id: rankingOptionsLabel[rankingType] })
      : "";
  }, [rankingType]);

  return (
    <Form form={form} colon={false}>
      <div className="common-wrapper">
        <div className="form-block">
          <div className="form-title form-title-inline">
            {formatMessage({ id: "TEMPLATE_SUBJECT_ANSWER_SORTABLE" })}
            <Form.Item name="sortable" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </div>
        <div className="form-block">
          <div className="form-title form-title-inline">
            {formatMessage({ id: "TEMPLATE_SUBJECT_ANSWER_WRITEABLE" })}
            <Form.Item name="editable" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </div>
        <div className="form-block">
          <div className="form-title form-title-inline">
            {formatMessage({ id: "TEMPLATE_SUBJECT_ANSWER_EDITABLE" })}
            <Form.Item name="addible" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          {/* <Form.Item
            shouldUpdate={(prevValues, curValues) =>
              curValues.addible !== prevValues.addible
            }
            noStyle
          >
            {
              ({ getFieldValue }) =>
                getFieldValue('addible') && (
                  <div className="common-panel">
                    <div style={{ display: 'flex', marginBottom: 6 }}>
                      <Form.Item
                        name="add_model_flag"
                        style={{ marginRight: 12 }}
                        valuePropName="checked">
                        <Checkbox>
                          {formatMessage({ id: 'TEMPLATE_SUBJECT_REAL_TIME_INTERFACE' })}
                        </Checkbox>
                      </Form.Item>
                      <Form.Item
                        shouldUpdate={(prevValues, curValues) =>
                          curValues.add_model_flag !== prevValues.add_model_flag
                        }
                      >
                        {
                          ({ getFieldValue }) =>
                            getFieldValue('add_model_flag') && (
                              <Form.Item
                                style={{ width: 140 }}
                                name="add_model"
                                rules={[{ required: true, message: formatMessage({ id: 'COMMON_ERROR_REQUIRED' }) }]}
                              >
                                <Select placeholder={formatMessage({ id: 'COMMON_PLACEHOLDER_SELECT' })}>
                                  {AddModelOptions?.map(option => (
                                    <Select.Option value={option.value} key={option.value}>{option.label}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            )
                        }
                      </Form.Item>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <Form.Item
                        name="add_limit_flag"
                        style={{ marginRight: 12 }}
                        valuePropName="checked">
                        <Checkbox>
                          {formatMessage({ id: 'TEMPLATE_SUBJECT_ANSWER_EDITABLE_COUNT_LIMITED' })}
                        </Checkbox>
                      </Form.Item>
                      <Form.Item
                        shouldUpdate={(prevValues, curValues) =>
                          curValues.add_limit_flag !== prevValues.add_limit_flag
                        }
                      >
                        {
                          ({ getFieldValue }) =>
                            getFieldValue('add_limit_flag') && (
                              <div style={{ display: 'flex' }}>
                                <Form.Item
                                  style={{ width: 140, marginRight: 12 }}
                                  name="add_limit_operator"
                                  rules={[{ required: true, message: formatMessage({ id: 'COMMON_ERROR_REQUIRED' }) }]}
                                >
                                  <Select placeholder={formatMessage({ id: 'COMMON_PLACEHOLDER_SELECT' })}>
                                    {LimitOperatorOptions?.map(option => (
                                      <Select.Option value={option.value} key={option.value}>{option.label}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  name="add_limit"
                                  rules={[{ required: true, message: formatMessage({ id: 'COMMON_ERROR_REQUIRED' }) }]}
                                >
                                  <InputNumber precision={0} min={0} style={{ width: 180 }} placeholder={formatMessage({ id: 'COMMON_PLACEHOLDER' })} />
                                </Form.Item>
                              </div>
                            )
                        }
                      </Form.Item>
                    </div>
                  </div>
                )
            }
          </Form.Item> */}
        </div>
        <div className="form-block">
          <div className="form-title form-title-inline">
            {formatMessage({ id: "TEMPLATE_GLOBAL_ATTRIBUTES" })}
            <Popover
              placement="top"
              content={formatMessage({ id: "TEMPLATE_GLOBAL_ATTRIBUTES_TIP" })}
            >
              <InfoCircleOutlined />
            </Popover>
          </div>
          <Form.Item name="attributes_config">
            <LabelConfigField />
          </Form.Item>
        </div>
        <div className="form-block">
          <div
            className="form-title form-title-inline"
            style={{ marginBottom: 0 }}
          >
            {formatMessage({ id: "TEMPLATE_SUBJECT_RANKING" })}
            <Form.Item name="ranking" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <div className="form-title-sub" style={{ marginBottom: 16 }}>
            {formatMessage({ id: "TEMPLATE_SUBJECT_RANKING_SUB" })}
          </div>
          <Form.Item
            shouldUpdate={(prevValues, curValues) =>
              curValues.ranking !== prevValues.ranking
            }
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue("ranking") && (
                <div className="common-panel">
                  <Form.Item
                    labelCol={{ sm: 8, lg: 6, xl: 5 }}
                    wrapperCol={{ sm: 16, lg: 18, xl: 19 }}
                    initialValue={RankingType.SCORE}
                    name="ranking_type"
                    rules={[
                      {
                        required: true,
                        message: formatMessage({
                          id: "TEMPLATE_SUBJECT_RANKING_TYPE_REQUIRED",
                        }),
                      },
                    ]}
                    label={formatMessage({
                      id: "TEMPLATE_SUBJECT_RANKING_TYPE",
                    })}
                  >
                    <Radio.Group>
                      {RankingTypeOptions.map((option) => (
                        <Radio value={option.value} key={option.value}>
                          {formatMessage({ id: option.label })}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    labelCol={{ sm: 8, lg: 6, xl: 5 }}
                    wrapperCol={{ sm: 16, lg: 18, xl: 19 }}
                    label={getRankingOptionsLabel}
                  >
                    <Form.List
                      name="ranking_options"
                      rules={[
                        {
                          validator: async (_, ranking_options) => {
                            if (
                              !ranking_options ||
                              ranking_options.length < 1
                            ) {
                              return Promise.reject(
                                new Error(
                                  formatMessage({
                                    id: "TEMPLATE_SUBJECT_ANSWER_COMMENT_DEMENSION_REQUIRED",
                                  })
                                )
                              );
                            }
                          },
                        },
                      ]}
                    >
                      {(fields, { add, remove }, { errors }) => (
                        <>
                          {fields.map((field) => (
                            <Form.Item required={true} key={field.key}>
                              <Form.Item
                                {...field}
                                validateTrigger={["onBlur", "onChange"]}
                                rules={[
                                  {
                                    required: true,
                                    whitespace: true,
                                    message: formatMessage({
                                      id: "TEMPLATE_SUBJECT_ANSWER_COMMENT_DEMENSION_ITEM_EMPTY",
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
                              style={{ padding: 0 }}
                              type="link"
                              onClick={() => add()}
                            >
                              {formatMessage({ id: "COMMON_ADD_BY_CLICK" })}
                            </Button>
                            <Form.ErrorList errors={errors} />
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                </div>
              )
            }
          </Form.Item>
        </div>
        <div className="form-block">
          <div className="form-title form-title-inline">
            {formatMessage({ id: "TEMPLATE_SINGLE_ATTRIBUTES" })}
            <Popover
              placement="top"
              content={formatMessage({ id: "TEMPLATE_SINGLE_ATTRIBUTES_TIP" })}
            >
              <InfoCircleOutlined />
            </Popover>
          </div>
          <Form.Item name="item_attributes_config">
            <LabelConfigField />
          </Form.Item>
        </div>
        <div className="form-block">
          <div
            className="form-title form-title-inline"
            style={{ marginBottom: 0 }}
          >
            {formatMessage({ id: "TEMPLATE_SUBJECT_ANSWER_TOPIC" })}
          </div>
          <div className="form-title-sub" style={{ marginBottom: 16 }}>
            {formatMessage({ id: "TEMPLATE_SUBJECT_ANSWER_TOPIC_SUB" })}
          </div>
          <Form.Item
            name="subjects"
            rules={[
              () => ({
                validator(_, value) {
                  if (value) {
                    const realValue = value
                      .split(",")
                      .filter((val: string) => val);
                    const removedDuplicateValueLength = Array.from(
                      new Set(realValue)
                    ).length;
                    if (realValue.length !== removedDuplicateValueLength) {
                      return Promise.reject(
                        new Error(
                          formatMessage({
                            id: "TEMPLATE_COMMON_ERROR_DUPLICATE",
                          })
                        )
                      );
                    }
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputTagCom
              placeholder={formatMessage({ id: "COMMON_PLACEHOLDER" })}
            />
          </Form.Item>
          <div className="form-item-control-sub">
            {formatMessage({ id: "TEMPLATE_SUBJECT_ANSWER_TOPIC_EXAMPLE" })}
          </div>
        </div>
      </div>
      <div className="common-footer">
        <Button
          style={{ marginRight: 16 }}
          onClick={(e) => {
            e.preventDefault();

            onPrev();
          }}
        >
          {formatMessage({ id: "COMMON_PREV_STEP" })}
        </Button>
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
    </Form>
  );
});

export default LabelSubjectQuestionAnswer;
