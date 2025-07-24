import { useIntl } from "@umijs/max";
import { Col, Input, Row, Form, message, InputNumber } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import MaterialModal from "@/components/MaterialModal";
import { useEffect, useState } from "react";
import type { BPO, GlobalTag } from "@/types/vm";
import { createBpo, getBpoDetail, updateBpo } from "@/services/vm";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { User } from "@/types/user";

import styles from "./Style.less";
import { HttpStatus } from "@/types/http";
import { bpoCodeRegex, EmailValidator } from "@/utils/validator";
import { enableEmailAuth } from "@/utils";

interface Props {
  visible: boolean;
  bpoId?: string;
  allTags?: GlobalTag[];
  onClose: () => void;
  onSave: (user: User) => void;
}

const { Item } = Form;

function BPOCreateModal({
  allTags = [],
  visible,
  bpoId,
  onSave,
  onClose,
}: Props) {
  const { formatMessage } = useIntl();
  const [data, setData] = useState<BPO>();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const {
    name,
    bpoCode,
    contact,
    contactEmail,
    contactPhone,
    workerNumber,
    tags,
  } = data || {};

  const handleSave = async () => {
    form.validateFields().then((values) => {
      Object.assign(values, { name: values.name.trim() });
      saveBpo({
        ...values,
        tags: (values.tags || []).map((item: string) =>
          allTags.find((tag) => tag.id === item)
        ),
      });
    });
  };

  const saveBpo = async (values: BPO) => {
    setLoading(true);
    try {
      const resp = bpoId
        ? await updateBpo({ ...data, ...values })
        : await createBpo(values);
      if (resp.status !== HttpStatus.OK) {
        message.error(mapStatusToErrorMessage(resp));
      } else {
        message.success(formatMessage({ id: "common.message.success.create" }));
        onSave(resp.data);
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const getBpo = async () => {
    try {
      setLoading(true);
      const resp = await getBpoDetail(bpoId);
      setData(resp.data);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name,
        bpoCode,
        contact,
        contactEmail,
        contactPhone,
        workerNumber,
        tags: (tags || []).map((item) => item.id),
      });
    }
  }, [data]);

  useEffect(() => {
    if (bpoId && visible) {
      getBpo();
    } else {
      setData(null);
      form.resetFields();
    }
  }, [visible, bpoId]);

  return (
    <MaterialModal
      title={formatMessage({
        id: `bpo-list.bpo.${bpoId ? "update" : "create"}`,
      })}
      visible={visible}
      onSave={handleSave}
      onClose={onClose}
      saveLoading={loading}
    >
      <Form layout="vertical" form={form}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "bpo-list.bpo.name" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              name="name"
              initialValue={name}
              rules={[
                {
                  required: true,
                  message: formatMessage(
                    { id: "common.input.placeholder.with-label" },
                    { label: formatMessage({ id: "bpo-list.bpo.name" }) }
                  ),
                },
              ]}
            >
              <Input />
            </Item>
          </Col>
        </Row>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "bpo-list.bpo.codename" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              name="bpoCode"
              initialValue={bpoCode}
              rules={[
                {
                  required: true,
                  message: formatMessage(
                    { id: "common.input.placeholder.with-label" },
                    { label: formatMessage({ id: "bpo-list.bpo.codename" }) }
                  ),
                },
                {
                  pattern: bpoCodeRegex,
                  message: formatMessage({
                    id: "common.format.error",
                  }),
                },
              ]}
              extra={
                <p style={{ margin: 0, color: "#42526e" }}>
                  <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                  {formatMessage({ id: "bpo-list.bpo.codename.tip" })}
                </p>
              }
            >
              <Input disabled={!!bpoId} />
            </Item>
          </Col>
        </Row>
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "bpo-list.bpo.contactName" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              name="contact"
              initialValue={contact}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: "bpo-list.bpo.contactName-require",
                  }),
                },
              ]}
            >
              <Input />
            </Item>
          </Col>
          <Col span={12}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "bpo-list.bpo.contactEmail" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              name="contactEmail"
              initialValue={contactEmail}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: "bpo-list.bpo.contactEmail-require",
                  }),
                },
                {
                  validator: EmailValidator,
                },
              ]}
            >
              <Input disabled={!!bpoId && enableEmailAuth()} />
            </Item>
          </Col>
          <Col span={12}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "bpo-list.bpo.contactPhone" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              name="contactPhone"
              initialValue={contactPhone}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: "bpo-list.bpo.contactPhone-require",
                  }),
                },
              ]}
            >
              <Input />
            </Item>
          </Col>
          <Col span={12}>
            <Item
              label={
                <span className={styles["form-label"]}>
                  {formatMessage({ id: "bpo-list.bpo.workerNum" })}
                </span>
              }
              colon={false}
              className={styles["form-item"]}
              name="workerNumber"
              initialValue={workerNumber}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: "bpo-list.bpo.workerNum-require",
                  }),
                },
              ]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Item>
          </Col>
        </Row>
        {/*<Row gutter={[24, 24]}>*/}
        {/*  <Col span={24}>*/}
        {/*    <Item*/}
        {/*      label={*/}
        {/*        <span className={styles['form-label']}>*/}
        {/*          {formatMessage({ id: 'bpo-list.bpo.tags' })}*/}
        {/*        </span>*/}
        {/*      }*/}
        {/*      colon={false}*/}
        {/*      className={styles['form-item']}*/}
        {/*      name="tags"*/}
        {/*    >*/}
        {/*      <Select mode="multiple">*/}
        {/*        {allTags.map(item => (*/}
        {/*          <Select.Option key={item.id} value={item.id}>*/}
        {/*            {item.name}*/}
        {/*          </Select.Option>*/}
        {/*        ))}*/}
        {/*      </Select>*/}
        {/*    </Item>*/}
        {/*  </Col>*/}
        {/*</Row>*/}
      </Form>
    </MaterialModal>
  );
}

export default BPOCreateModal;
