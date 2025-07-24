import React, { useEffect, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Popconfirm, Button, Switch, Modal } from "antd";
import { useIntl } from "@umijs/max";
import { nanoid } from "nanoid";
import LabelConfigField from "./LabelConfigField";
import OntologyChildEditor from "./OntologyChildEditor";
import { Tool } from "./types";
import type { GeneralImageOntology, GeneralImageOntologyChild } from "./types";
import styles from "./styles.less";

export interface OntologyItemEditorHandle {
  validate: () => Promise<boolean>;
}

interface OntologyItemEditorProps {
  ontologyItem: GeneralImageOntology;
  onChange: (item: GeneralImageOntology) => void;
  onDelete: (itemKey: string) => void;
  validateOntologyClass: (key: string, ontologyClass: string) => boolean;
}

const OntologyItemEditor = React.forwardRef<
  OntologyItemEditorHandle,
  OntologyItemEditorProps
>(({ ontologyItem, onChange, onDelete, validateOntologyClass }, ref) => {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  useEffect(() => {
    form.resetFields();
  }, [ontologyItem]);

  useImperativeHandle(ref, () => ({
    validate: () =>
      new Promise<boolean>((resolve) => {
        form
          .validateFields()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }),
  }));

  /**
   * handle input values change
   */
  const handleInputChange = () => {
    form.validateFields().then((values) => {
      onChange({
        ...ontologyItem,
        ...values,
      });
    });
  };

  /**
   * handle form change
   * @param changedValues
   */
  const handleFormChange = (changedValues: any) => {
    const values = { ...changedValues };
    delete values.class_name;
    delete values.display_name;
    const newItem = { ...ontologyItem, ...values };
    if (values.multiple !== undefined) {
      Modal.confirm({
        title: formatMessage({
          id: "tool.general-image.ontology.multiple.confirm",
        }),
        onOk: () => {
          if (values.multiple) {
            // set to multiple
            delete newItem.children;
          } else {
            // set to single
            newItem.children = [
              {
                key: nanoid(),
                name: formatMessage({ id: "tool.general-image.new-child" }),
                count: 1,
                display_color: newItem.display_color,
                tools: [{ type: Tool.RECTANGLE }],
              },
            ];
          }
          onChange(newItem);
        },
        onCancel: () => {
          newItem.multiple = !newItem.multiple;
          onChange(newItem);
        },
      });
    } else if (Object.keys(values).length > 0) {
      onChange(newItem);
    }
  };

  /**
   * handle child change
   * @param child
   */
  const handleChildChange = (child: GeneralImageOntologyChild) => {
    onChange({
      ...ontologyItem,
      display_color: child.display_color,
      children: [child],
    });
  };

  return (
    <>
      <div className={styles.header}>
        <Popconfirm
          title={formatMessage({
            id: "tool.general-image.ontology.delete.confirm",
          })}
          placement="bottomLeft"
          onConfirm={() => onDelete(ontologyItem.key)}
        >
          <Button type="link" danger>
            {formatMessage({ id: "tool.general-image.ontology.delete" })}
          </Button>
        </Popconfirm>
      </div>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={ontologyItem}
        onValuesChange={handleFormChange}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="class_name"
              label={formatMessage({
                id: "tool.general-image.ontology.class-name.label",
              })}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: "tool.general-image.ontology.class-name.required",
                  }),
                },
                {
                  validator(_, value) {
                    if (
                      !value ||
                      validateOntologyClass(ontologyItem.key, value)
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        formatMessage({
                          id: "tool.general-image.ontology.class-name.exist",
                        })
                      )
                    );
                  },
                },
              ]}
            >
              <Input
                placeholder={formatMessage({
                  id: "tool.general-image.ontology.class-name.placeholder",
                })}
                onBlur={handleInputChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="display_name"
              label={formatMessage({
                id: "tool.general-image.ontology.display-name.label",
              })}
            >
              <Input
                placeholder={formatMessage({
                  id: "tool.general-image.ontology.display-name.placeholder",
                })}
                onBlur={handleInputChange}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="label_config"
              label={formatMessage({
                id: "tool.general-image.ontology.attr.label",
              })}
            >
              <LabelConfigField />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="multiple"
              label={formatMessage({
                id: "tool.general-image.ontology.multiple.label",
              })}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      {!ontologyItem.multiple && (
        <OntologyChildEditor
          multipleMode={false}
          child={ontologyItem.children[0]}
          onChange={handleChildChange}
        />
      )}
    </>
  );
});

export default OntologyItemEditor;
