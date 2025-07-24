import { useEffect, useState } from "react";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Tag, Col, Row, Spin } from "antd";
import { useIntl } from "@umijs/max";
import { GlobalTag } from "@/types/vm";

import style from "../superadmin/Style.less";

interface GlobalTagsModalProp {
  visible: boolean;
  onCancel: () => void;
  tags: GlobalTag[];
  addGlobalTag: (name: string) => void;
  deleteGlobalTag: (id: string) => void;
  updating: boolean;
}
export default function GlobalTagsModal({
  visible,
  onCancel,
  addGlobalTag,
  deleteGlobalTag,
  tags,
  updating,
}: GlobalTagsModalProp) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [globalTags, setGlobalTags] = useState<GlobalTag[]>([]);

  const [inputValue, setInputValue] = useState("");
  const [newTag, setNewTag] = useState<string>();

  useEffect(() => {
    setGlobalTags(tags);
  }, [tags]);

  const addTags = () => {
    if (!newTag || !newTag.trim()) {
      return;
    }

    addGlobalTag(newTag.trim());
    setNewTag("");
  };

  return (
    <Modal
      title={formatMessage({ id: "bpo-list.bpo.tag.global" })}
      visible={visible}
      footer={null}
      centered
      maskClosable={false}
      onCancel={onCancel}
      afterClose={() => setInputValue(null)}
    >
      <Spin spinning={updating}>
        <div className="margin-bottom-4">
          <Input
            size="small"
            value={inputValue}
            placeholder={formatMessage({
              id: "bpo-list.bpo.tag.modal.placeholder",
            })}
            onChange={(e) => setInputValue(e.target.value)}
            allowClear
          />
        </div>
        <div className="flex-between margin-top-2 margin-bottom-2">
          {formatMessage({ id: "bpo-list.bpo.tag.modal.tag.list" })}
        </div>
        <Row>
          {globalTags
            ?.filter(
              (tag) => !inputValue || tag?.name?.indexOf(inputValue) !== -1
            )
            ?.map((tag) => (
              <Col
                span={12}
                key={tag.id}
                style={{ display: "flex", alignItems: "center" }}
              >
                <Tag
                  key={tag.id}
                  className={`${style.bpoTag} text-ellipsis`}
                  style={{ width: 160 }}
                >
                  {tag.name}
                </Tag>
                <Button
                  type="link"
                  style={{ color: "#F56C6C" }}
                  icon={<CloseOutlined />}
                  onClick={() => deleteGlobalTag(tag.id)}
                />
              </Col>
            ))}
          <Col span={12}>
            <Input
              size="small"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onPressEnter={addTags}
              style={{ width: 160, verticalAlign: "middle", marginRight: 9 }}
            />
            <Button
              type="link"
              icon={<SaveOutlined />}
              onClick={addTags}
              style={{ color: "#0ead68" }}
            />
          </Col>
        </Row>
      </Spin>
    </Modal>
  );
}
