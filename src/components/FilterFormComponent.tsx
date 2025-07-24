import type { ChangeEvent, CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import { Input, Select, Cascader, Button, DatePicker, Form, Radio } from "antd";
import { useIntl } from "@umijs/max";
import useDebounce from "@/hooks/useDebounce";
import { RadioChangeEvent } from "antd/lib/radio/interface";

interface FilterFormComponentProp {
  formLayout?: "horizontal" | "inline" | "vertical";
  formStyle?: CSSProperties;
  formItemStyle?: CSSProperties;
  buttonStyle?: CSSProperties;
  formItems: FormItem[];
  children?: ReactNode;
  extraItems?: ReactNode;
  initialValue: Record<string, any>;
  value?: Record<string, any>;
  onFilterValueChange: (val: Record<string, any>) => void;
  onReset?: () => void;
  searchMode?: "click" | "change";
  isReset?: boolean;
}

export default function FilterFormComponent(props: FilterFormComponentProp) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const {
    formLayout = "inline",
    formItems = [],
    formStyle = { marginBottom: 15 },
    formItemStyle = {},
    buttonStyle = {},
    children,
    extraItems,
    initialValue = {},
    value,
    onFilterValueChange,
    onReset,
    searchMode = "change",
    isReset = true,
  } = props || {};
  const [filterValues, setFilterValues] = useState(initialValue);

  const handleValueChangeDebounce = useDebounce(onFilterValueChange, 1000);

  const handleValueChange = (
    item: FormItem,
    val: any,
    isNeedDebounce: boolean = false
  ) => {
    setFilterValues({ ...filterValues, [item.key]: val });
    if (searchMode === "change") {
      if (isNeedDebounce) {
        handleValueChangeDebounce({ ...filterValues, [item.key]: val });
      } else {
        onFilterValueChange({ ...filterValues, [item.key]: val });
      }
    }
    if (item.onChange) {
      item.onChange(val);
    }
  };

  const handleSearch = () => {
    onFilterValueChange(filterValues);
  };

  const handleReset = () => {
    setFilterValues({});
    onFilterValueChange({});
    if (onReset) {
      onReset();
    }
  };

  useEffect(() => {
    if (value) {
      setFilterValues(value);
    }
  }, [value]);

  return (
    <Form layout={formLayout} style={formStyle}>
      {extraItems}
      {formItems.map((item) => (
        <Form.Item
          key={item.key || JSON.stringify(item)}
          colon={!!item?.label}
          label={<span style={{ color: "#42526e" }}>{item?.label}</span>}
          style={{ marginBottom: 16, ...formItemStyle }}
        >
          {(() => {
            switch (item.type) {
              case FormItemType.Text:
                return (
                  <Input
                    allowClear={item.allowClear || false}
                    disabled={item.disabled || false}
                    value={filterValues[item.key]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleValueChange(item, e.target.value, true)
                    }
                    placeholder={
                      item.placeholder ||
                      formatMessage({ id: "common.input.placeholder" })
                    }
                    style={item.style || { width: 220 }}
                  />
                );
              case FormItemType.Single:
                return (
                  <Select
                    allowClear={item.allowClear || false}
                    disabled={item.disabled || false}
                    value={filterValues[item.key]}
                    showSearch={"showSearch" in item ? item.showSearch : true}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option.props.children as string)
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    onChange={(val: any) => handleValueChange(item, val)}
                    style={item.style || { width: 220 }}
                    placeholder={
                      item.placeholder ||
                      formatMessage({ id: "common.select.placeholder" })
                    }
                  >
                    {item.options.map((option: any) => (
                      <Select.Option
                        key={
                          item.optionValueKey
                            ? option[item.optionValueKey]
                            : option
                        }
                        value={
                          item.optionValueKey
                            ? option[item.optionValueKey]
                            : option
                        }
                      >
                        {item.optionLabelKey
                          ? option[item.optionLabelKey]
                          : item.optionLabel(option)}
                      </Select.Option>
                    ))}
                  </Select>
                );
              case FormItemType.Multiple:
                return (
                  <Select
                    allowClear={item.allowClear || false}
                    disabled={item.disabled || false}
                    mode="multiple"
                    showArrow
                    value={filterValues[item.key] || []}
                    maxTagCount={item.maxTagCount || 100}
                    showSearch={"showSearch" in item ? item.showSearch : true}
                    optionFilterProp={item.optionFilterProp || "children"}
                    filterOption={
                      "optionFilterProp" in item ||
                      function (input, option) {
                        return (
                          (option.props.children as string)
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        );
                      }
                    }
                    onChange={(val: any) => handleValueChange(item, val, true)}
                    style={item.style || { width: 220 }}
                    placeholder={
                      item.placeholder ||
                      formatMessage({ id: "common.select.placeholder" })
                    }
                  >
                    {item.options.map((option: any) => (
                      <Select.Option
                        key={
                          item.optionValueKey
                            ? option[item.optionValueKey]
                            : option
                        }
                        value={
                          item.optionValueKey
                            ? option[item.optionValueKey]
                            : option
                        }
                        label={
                          item.optionLabelKey
                            ? option[item.optionLabelKey]
                            : option
                        }
                      >
                        {item.optionLabel
                          ? item.optionLabel(option)
                          : option[item.optionLabelKey]}
                      </Select.Option>
                    ))}
                  </Select>
                );
              case FormItemType.Cascader:
                return (
                  <Cascader
                    options={item.options}
                    value={filterValues[item.key] || []}
                    fieldNames={item.fieldNames}
                    style={item.style || { width: 240 }}
                    changeOnSelect
                    showSearch={item.showSearch}
                    onChange={(val: any) => handleValueChange(item, val, true)}
                  />
                );
              case FormItemType.CascaderMultiple:
                return (
                  <Cascader
                    options={item.options}
                    value={filterValues[item.key] || []}
                    fieldNames={item.fieldNames}
                    style={item.style || { width: 240 }}
                    changeOnSelect
                    multiple
                    maxTagCount={2}
                    placeholder={formatMessage({
                      id: "common.select.placeholder",
                    })}
                    showSearch={item.showSearch}
                    onChange={(val: any) => handleValueChange(item, val, true)}
                  />
                );
              case FormItemType.Radio:
                return (
                  <Radio.Group
                    value={filterValues[item.key]}
                    style={item.style}
                    onChange={(e: RadioChangeEvent) => {
                      handleValueChange(item, e.target.value, true);
                    }}
                  >
                    {item.options.map((option: any) => (
                      <Radio
                        key={
                          item.optionValueKey
                            ? option[item.optionValueKey]
                            : option
                        }
                        value={
                          item.optionValueKey
                            ? option[item.optionValueKey]
                            : option
                        }
                      >
                        {item.optionLabelKey
                          ? option[item.optionLabelKey]
                          : item.optionLabel(option)}
                      </Radio>
                    ))}
                  </Radio.Group>
                );
              case FormItemType.DateRanger:
                return (
                  <DatePicker.RangePicker
                    style={item.style || { width: 240 }}
                    allowClear={item.allowClear}
                    value={filterValues[item.key]}
                    onChange={(val: any) => handleValueChange(item, val, true)}
                    disabledDate={item.disabledDate}
                  />
                );
              default:
                return null;
            }
          })()}
        </Form.Item>
      ))}
      {searchMode === "click" && (
        <div style={buttonStyle}>
          <Button
            type="primary"
            className="btn-width"
            style={{ margin: "0 16px 0 0" }}
            onClick={handleSearch}
          >
            {formatMessage({ id: "common.search" })}
          </Button>
          {isReset && (
            <Button className="btn-width" onClick={handleReset}>
              {formatMessage({ id: "common.reset" })}
            </Button>
          )}
        </div>
      )}
      {children}
    </Form>
  );
}
