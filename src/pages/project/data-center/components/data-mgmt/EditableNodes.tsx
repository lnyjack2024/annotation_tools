import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  ReactNode,
} from "react";
import { Form, Input, Button } from "antd";
import type { FormInstance } from "antd/es/form";
import type { InputRef } from "antd";
import { FormOutlined } from "@ant-design/icons";

import styles from "./styles.less";
import type { SourceFile } from "@/types/dataset";
import { useIntl } from "@umijs/max";
interface EditableRowProps {
  index: number;
}
const EditableContext = React.createContext<FormInstance<any> | null>(null);

export const EditableRow: React.FC<EditableRowProps> = ({
  index,
  ...props
}) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: ReactNode;
  editable: boolean;
  children: ReactNode;
  dataIndex: keyof SourceFile;
  record: SourceFile;
  handleSave: (record: SourceFile, cb: (o?: any) => void) => void;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const preBatchName = children[1];
      if (preBatchName === values.batchName) {
        toggleEdit();
        return;
      }
      handleSave({ ...record, ...values }, toggleEdit);
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0, width: 208 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
          () => ({
            validator(_, value) {
              if (value.length > 100) {
                return Promise.reject(formatMessage({ id: "55075" }));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <Form.Item
        className={styles.editableCellValueWrap}
        style={{ margin: 0, width: 208 }}
      >
        <Button
          type="link"
          size="small"
          style={{ paddingLeft: 0 }}
          onClick={toggleEdit}
        >
          <FormOutlined />
        </Button>
        {children}
      </Form.Item>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};
