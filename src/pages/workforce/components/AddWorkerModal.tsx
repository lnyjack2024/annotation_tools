import { useIntl } from "@umijs/max";
import MaterialModal from "@/components/MaterialModal";
import { Col, Form, Input, Row, Checkbox } from "antd";
import styles from "@/pages/bpo/superadmin/Style.less";
import { Role } from "@/types/auth";
import { GlobalTag } from "@/types/vm";
import { useEffect, useState } from "react";
import { User } from "@/types/user";
import { emailRegex, nameRegex } from "@/utils/validator";
import { enableEmailAuth } from "@/utils";

interface Props {
  visible: boolean;
  onClose: () => void;
  roles: Role[];
  tags: GlobalTag[];
  onSave: (values: User) => void;
}

const { Item } = Form;

function AddWorkerModal({
  visible,
  roles = [],
  tags = [],
  onSave,
  onClose,
}: Props) {
  const { formatMessage } = useIntl();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      Object.assign(values, { uniqueName: values.uniqueName.trim() });
      setSubmitting(true);
      await onSave(values);
      setSubmitting(false);
    });
  };

  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible]);

  return (
    <MaterialModal
      title={formatMessage({ id: "job-detail.workforce.add" })}
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      saveLoading={submitting}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "common.username" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              name="uniqueName"
              rules={[
                {
                  required: true,
                  message: formatMessage(
                    { id: "common.input.placeholder.with-label" },
                    { label: formatMessage({ id: "common.username" }) }
                  ),
                },
                {
                  pattern: nameRegex,
                  message: formatMessage({
                    id: "common.format.error",
                  }),
                },
              ]}
            >
              <Input />
            </Item>
          </Col>
        </Row>
        {enableEmailAuth() && (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Item
                label={
                  <span className={styles["form-label"]}>
                    {formatMessage({ id: "common.email" })}
                  </span>
                }
                colon={false}
                className={styles["form-item"]}
                name="email"
                rules={[
                  {
                    required: true,
                    message: formatMessage(
                      { id: "common.input.placeholder.with-label" },
                      { label: formatMessage({ id: "common.email" }) }
                    ),
                  },
                  {
                    pattern: emailRegex,
                    message: formatMessage({
                      id: "common.format.error",
                    }),
                  },
                ]}
              >
                <Input />
              </Item>
            </Col>
          </Row>
        )}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "bpo-worker.table.column.role" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              rules={[
                {
                  required: true,
                  message: formatMessage(
                    { id: "common.select.placeholder.with-label" },
                    {
                      label: formatMessage({
                        id: "bpo-worker.table.column.role",
                      }),
                    }
                  ),
                },
              ]}
              name="role"
            >
              <Checkbox.Group>
                {roles.map((item) => (
                  <Checkbox key={item.id} value={item.id}>
                    {formatMessage({ id: `common.role.${item.name}` })}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Item>
          </Col>
        </Row>
        {/*{tags.length > 0 && (*/}
        {/*  <Row gutter={[24, 24]}>*/}
        {/*    <Col span={24}>*/}
        {/*      <Item*/}
        {/*        label={*/}
        {/*          <span className={styles['form-label']}>*/}
        {/*            {formatMessage({ id: 'bpo-list.bpo.tags' })}*/}
        {/*          </span>*/}
        {/*        }*/}
        {/*        colon={false}*/}
        {/*        className={styles['form-item']}*/}
        {/*        name="tags"*/}
        {/*      >*/}
        {/*        <Select mode="multiple" showSearch>*/}
        {/*          {tags.map(item => (*/}
        {/*            <Select.Option key={item.id} value={item.id}>*/}
        {/*              {item.name}*/}
        {/*            </Select.Option>*/}
        {/*          ))}*/}
        {/*        </Select>*/}
        {/*      </Item>*/}
        {/*    </Col>*/}
        {/*  </Row>*/}
        {/*)}*/}
      </Form>
    </MaterialModal>
  );
}

export default AddWorkerModal;
