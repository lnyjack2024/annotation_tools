import { DownOutlined } from "@ant-design/icons";
import { Button, Collapse, Dropdown, Input, Menu } from "antd";
import { useState } from "react";
import { useIntl } from "@umijs/max";

const { TextArea } = Input;
const { Panel } = Collapse;

const selectHtml = `<div class="form-group">
    <h4>Example select</h4>
    <select name="sample" class="form-control">
        <option>1</option>
        <option>2</option>
    </select>
</div>`;

const checkboxHtml = `<div class="form-group">
    <input name="sample" type="checkbox">
    <label>Check me out</label>
</div>`;

const checkboxGroupHtml = `<div class="form-group">
    <h4>Example Option</h4>
    <div class="form-check">
        <label class="form-check-label">
            <input name="sample1" type="checkbox" class=" form-check-input">Option 1
        </label>
    </div>
    <div class="form-check">
        <label class="form-check-label">
            <input name="sample2" type="checkbox" class=" form-check-input">Option 2
        </label>
    </div>
</div>`;

const radioHtml = `<div class="form-group">
    <h4>Example Radios</h4>
    <div>
        <input name="sample" type="radio">
        <label>First radio</label>
    </div>
    <div>
        <input name="sample" type="radio">
        <label>Second radio</label>
    </div>
</div>`;

const textHtml = `<div class="form-group">
    <h4>Sample Input</h4>
    <input name="sample" type="email" class="form-control">
</div>`;

const textAreaHtml = `<div class="form-group">
    <h4>Example textarea</h4>
    <textarea name="sample" class="form-control" rows="3"/>
</div>`;

export interface HtmlReferenceProps {
  itemSelect: (key: any) => void;
}

function HtmlReference({ itemSelect }: HtmlReferenceProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [visible, setVisible] = useState(false);

  const select = (val: string) => {
    itemSelect(val);
  };

  const handleVisibleChange = (flag: boolean) => {
    setVisible(flag);
  };

  const getRowNum = (text: string): number => text.split("\n").length;

  const menu = (
    <Menu style={{ width: "650px" }}>
      <Menu.Item>
        <Collapse accordion bordered={false}>
          <Panel
            showArrow={false}
            header="Select - select value from options."
            key="1"
          >
            <TextArea
              readOnly
              value={selectHtml}
              rows={getRowNum(selectHtml)}
            />
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Button onClick={() => select(selectHtml)} size="small">
                {formatMessage({ id: "template.htmlReference.add" })}
              </Button>
            </div>
          </Panel>
        </Collapse>
      </Menu.Item>
      <Menu.Item>
        <Collapse accordion bordered={false}>
          <Panel
            showArrow={false}
            header="Checkbox - toggle between two states."
            key="1"
          >
            <TextArea
              readOnly
              value={checkboxHtml}
              rows={getRowNum(checkboxHtml)}
            />
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Button onClick={() => select(checkboxHtml)} size="small">
                {formatMessage({ id: "template.htmlReference.add" })}
              </Button>
            </div>
          </Panel>
        </Collapse>
      </Menu.Item>
      <Menu.Item>
        <Collapse accordion bordered={false}>
          <Panel
            showArrow={false}
            header="Checkbox group - selecting multiple values from several options."
            key="1"
          >
            <TextArea
              readOnly
              value={checkboxGroupHtml}
              rows={getRowNum(checkboxGroupHtml)}
            />
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Button onClick={() => select(checkboxGroupHtml)} size="small">
                {formatMessage({ id: "template.htmlReference.add" })}
              </Button>
            </div>
          </Panel>
        </Collapse>
      </Menu.Item>
      <Menu.Item>
        <Collapse accordion bordered={false}>
          <Panel
            showArrow={false}
            header="Radio - select a single state from multiple options."
            key="1"
          >
            <TextArea readOnly value={radioHtml} rows={getRowNum(radioHtml)} />
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Button onClick={() => select(radioHtml)} size="small">
                {formatMessage({ id: "template.htmlReference.add" })}
              </Button>
            </div>
          </Panel>
        </Collapse>
      </Menu.Item>
      <Menu.Item>
        <Collapse accordion bordered={false}>
          <Panel
            showArrow={false}
            header="Text - single line text field."
            key="1"
          >
            <TextArea readOnly value={textHtml} rows={getRowNum(textHtml)} />
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Button onClick={() => select(textHtml)} size="small">
                {formatMessage({ id: "template.htmlReference.add" })}
              </Button>
            </div>
          </Panel>
        </Collapse>
      </Menu.Item>
      <Menu.Item>
        <Collapse accordion bordered={false}>
          <Panel
            showArrow={false}
            header="Textarea - multi line text field."
            key="1"
          >
            <TextArea
              readOnly
              value={textAreaHtml}
              rows={getRowNum(textAreaHtml)}
            />
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <Button onClick={() => select(textAreaHtml)} size="small">
                {formatMessage({ id: "template.htmlReference.add" })}
              </Button>
            </div>
          </Panel>
        </Collapse>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={["click"]}
      placement="bottomRight"
      visible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <Button type="link">
        {formatMessage({ id: "template.htmlReference.title" })}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default HtmlReference;
