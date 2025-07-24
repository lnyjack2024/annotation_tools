import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Skeleton } from "antd";
import { useIntl } from "@umijs/max";
import type { ChangeEvent } from "react";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { nanoid } from "nanoid";

interface QAProblemTypeEditorProp {
  loading?: boolean;
  problemTypes: string[];
}

function QAProblemTypeEditor(
  { loading = false, problemTypes }: QAProblemTypeEditorProp,
  parentRef: any
) {
  const { formatMessage } = useIntl();
  const [types, setTypes] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    setTypes(
      problemTypes.map((item) => ({
        key: nanoid(),
        value: item,
      }))
    );
  }, [problemTypes]);

  useImperativeHandle(parentRef, () => {
    const issueTypes = types.map((item) => item.value);
    const uniqueTypes = Array.from(new Set(issueTypes));
    return uniqueTypes.filter((type) => !!type);
  });

  const addType = () => {
    setTypes([
      ...types,
      {
        key: nanoid(),
        value: "",
      },
    ]);
  };

  const removeType = (key: string) => {
    const filtered = types.filter((item) => item.key !== key);
    setTypes(filtered);
  };

  const onTypeChange = (e: ChangeEvent<HTMLInputElement>, key: string) => {
    const newTypes = types.map((item) => {
      if (key === item.key) {
        return {
          key,
          value: e.target.value,
        };
      }

      return item;
    });
    setTypes(newTypes);
  };

  return (
    <Skeleton loading={loading}>
      {types.map((item) => (
        <div style={{ display: "flex", marginBottom: 10 }} key={item.key}>
          <Input
            style={{ width: "90%" }}
            placeholder={formatMessage({
              id: "template.qa.problem.config.placeholder",
            })}
            value={item.value}
            onChange={(e) => onTypeChange(e, item.key)}
          />
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => removeType(item.key)}
          />
        </div>
      ))}
      <Button block type="dashed" onClick={addType} style={{ width: "90%" }}>
        {formatMessage({ id: "template.qa.problem.config.add" })}
      </Button>
    </Skeleton>
  );
}

export default forwardRef(QAProblemTypeEditor);
