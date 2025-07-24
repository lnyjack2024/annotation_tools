import { Button, Checkbox, Col, Input, Modal, Row, Tag } from "antd";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";

import style from "@/pages/bpo/superadmin/Style.less";
import type { CheckboxValueType } from "antd/es/checkbox/Group";
import { GlobalTag } from "@/types/vm";

interface TagsModalProp {
  visible: boolean;
  onCancel: () => void;
  tags: GlobalTag[];
  selectedTags: GlobalTag[];
  updateTags: (tagIds: string[]) => void;
  updating: boolean;
}

export default function TagsModal({
  visible,
  onCancel,
  tags,
  selectedTags,
  updateTags,
  updating,
}: TagsModalProp) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [globalTags, setGlobalTags] = useState<GlobalTag[]>([]);
  const [checkedBPOTags, setCheckedBPOTags] = useState<string[]>([]);

  const [inputValue, setInputValue] = useState<string>();
  const [filteredTags, setFilteredTags] = useState<GlobalTag[]>([]);

  useEffect(() => {
    setGlobalTags(tags);
  }, [tags]);

  useEffect(() => {
    setCheckedBPOTags(selectedTags.map((item) => item.id));
  }, [selectedTags]);

  const handleInputValueChanged = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const filtered = (globalTags.filter(
      (tag) => tag.name.indexOf(val) !== -1
    ) || []) as GlobalTag[];
    setFilteredTags(filtered as GlobalTag[]);
  };

  const afterClose = () => {
    setInputValue(null);
  };

  const handleValueChange = (val: CheckboxValueType[]) => {
    let filteredCheckedValues: string[] = [];
    if (inputValue) {
      filteredCheckedValues = globalTags
        .filter(
          (tag) =>
            tag.name.indexOf(inputValue) === -1 &&
            checkedBPOTags.indexOf(tag.name) !== -1
        )
        .map((item) => item.id);
    }
    // setCheckedBPOTags(filteredCheckedValues);
    setCheckedBPOTags(filteredCheckedValues.concat(val as string[]));
  };

  return (
    <Modal
      title={formatMessage({ id: "bpo-list.bpo.tag.modal.title" })}
      visible={visible}
      footer={null}
      centered
      maskClosable={false}
      onCancel={onCancel}
      afterClose={afterClose}
    >
      <Input
        className="margin-bottom-4"
        size="small"
        value={inputValue}
        placeholder={formatMessage({
          id: "bpo-list.bpo.tag.modal.placeholder",
        })}
        onChange={handleInputValueChanged}
        allowClear
      />

      <div className="flex-between margin-top-2 margin-bottom-2">
        {formatMessage({ id: "bpo-list.bpo.tag.modal.tag.list" })}
      </div>
      <Checkbox.Group
        value={checkedBPOTags}
        onChange={handleValueChange}
        style={{ width: 500 }}
      >
        <Row gutter={[10, 10]}>
          {(inputValue ? filteredTags : globalTags)?.map((tag) => (
            <Col span={12} key={tag.id}>
              <Checkbox
                value={tag.id}
                style={{ display: "flex", alignItems: "center" }}
              >
                <Tag className={`${style.bpoTag} text-ellipsis`}>
                  {tag.name}
                </Tag>
              </Checkbox>
            </Col>
          ))}
        </Row>
      </Checkbox.Group>

      <div className="text-right margin-top-4">
        {inputValue && (
          <span style={{ marginRight: 10, fontSize: 12 }}>
            {formatMessage({ id: "bpo-list.bpo.tag.error" })}
          </span>
        )}
        <Button
          disabled={!!inputValue}
          type="primary"
          onClick={() => updateTags(checkedBPOTags)}
          loading={updating}
        >
          {formatMessage({ id: "common.save" })}
        </Button>
      </div>
    </Modal>
  );
}
