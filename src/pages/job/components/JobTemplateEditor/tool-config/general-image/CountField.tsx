import { useEffect, useRef, useState } from "react";
import { Row, Col, Select, InputNumber } from "antd";
import { useIntl } from "@umijs/max";
import { isNil } from "@/utils/utils";

enum Operator {
  EQUAL = "equal_to",
  GREATER_EQUAL = "greater_than_or_equal_to",
  LESS_EQUAL = "less_than_or_equal_to",
  BETWEEN = "between",
}

interface CountData {
  count?: number | null;
  min_count?: number | null;
  max_count?: number | null;
}

interface CountFieldProps extends CountData {
  onChange: (data: CountData) => void;
}

const { Option } = Select;

const CountField: React.FC<CountFieldProps> = ({
  count,
  min_count,
  max_count,
  onChange,
}) => {
  const { formatMessage } = useIntl();
  const [operator, setOperator] = useState<Operator>(Operator.EQUAL);
  const [value, setValue] = useState<number | null>(null);
  const [value2, setValue2] = useState<number | null>(null);
  const isUpdatedRef = useRef(false);

  useEffect(() => {
    isUpdatedRef.current = false;
    if (!isNil(count) && !Number.isNaN(count)) {
      setOperator(Operator.EQUAL);
      setValue(count);
    } else {
      const hasMinCount = !isNil(min_count) && !Number.isNaN(min_count);
      const hasMaxCount = !isNil(max_count) && !Number.isNaN(max_count);
      if (hasMinCount && !hasMaxCount) {
        setOperator(Operator.GREATER_EQUAL);
        setValue(min_count);
      } else if (hasMaxCount && !hasMinCount) {
        setOperator(Operator.LESS_EQUAL);
        setValue(max_count);
      } else if (hasMaxCount && hasMaxCount) {
        setOperator(Operator.BETWEEN);
        setValue(min_count);
        setValue2(max_count);
      } else {
        // default set to equal
        setOperator(Operator.EQUAL);
        setValue(null);
        setValue2(null);
      }
    }
  }, [count, min_count, max_count]);

  useEffect(() => {
    if (isUpdatedRef.current) {
      if (operator === Operator.EQUAL) {
        onChange({ count: value, min_count: null, max_count: null });
      } else if (operator === Operator.GREATER_EQUAL) {
        onChange({ count: null, min_count: value, max_count: null });
      } else if (operator === Operator.LESS_EQUAL) {
        onChange({ count: null, min_count: null, max_count: value });
      } else if (operator === Operator.BETWEEN) {
        onChange({ count: null, min_count: value, max_count: value2 });
      }
    }
  }, [operator, value, value2]);

  const handleOperatorChange = (o: Operator) => {
    isUpdatedRef.current = true;
    setOperator(o);
  };

  const handleChange = (v: number | null) => {
    isUpdatedRef.current = true;
    setValue(v);
  };

  const handleChange2 = (v: number | null) => {
    isUpdatedRef.current = true;
    setValue2(v);
  };

  return (
    <Row gutter={8}>
      <Col span={4}>
        <Select value={operator} onChange={handleOperatorChange}>
          <Option value={Operator.EQUAL}>=</Option>
          {/* <Option value={Operator.GREATER_EQUAL}>≥</Option> */}
          {/* <Option value={Operator.LESS_EQUAL}>≤</Option> */}
          {/* <Option value={Operator.BETWEEN}>
            {formatMessage({ id: 'tool.general-image.child.count.range' })}
          </Option> */}
        </Select>
      </Col>
      <Col span={8}>
        {operator === Operator.BETWEEN ? (
          <>
            <InputNumber
              style={{ width: "50%", transition: "none" }}
              placeholder={formatMessage({
                id: "tool.general-image.child.count.min-count",
              })}
              min={1}
              precision={0}
              value={value}
              onChange={handleChange}
            />
            <InputNumber
              style={{ width: "50%", transition: "none" }}
              placeholder={formatMessage({
                id: "tool.general-image.child.count.max-count",
              })}
              min={1}
              precision={0}
              value={value2}
              onChange={handleChange2}
            />
          </>
        ) : (
          <InputNumber
            style={{ width: "100%", transition: "none" }}
            placeholder={formatMessage({
              id: "tool.general-image.child.count.placeholder",
            })}
            min={1}
            precision={0}
            value={value}
            onChange={handleChange}
          />
        )}
      </Col>
    </Row>
  );
};

export default CountField;
