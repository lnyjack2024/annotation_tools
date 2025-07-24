import { useEffect, useState } from "react";
import { Button, Select, Input } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import ProcessDataFilterModal from "@/pages/project/data-center/components/ProcessDataFilterModal";

type FilterItem = {
  type?: string;
  value: string;
  relation?: "AND" | "OR";
};

enum RelationType {
  AND = "AND",
  OR = "OR",
}

function AdvancedFilter() {
  const { formatMessage } = useIntl();
  const [columnFilter, setColumnFilter] = useState<FilterItem[]>([]);
  const [processFilter, setProcessFilter] = useState<FilterItem[]>([]);
  const [processFilterVisible, setProcessFilterVisible] = useState(false);

  const CornerLine = () => (
    <i
      style={{
        position: "absolute",
        top: 14,
        left: 36,
        display: "inline-block",
        borderTop: "2px solid #1da57a",
        borderLeft: "2px solid #1da57a",
        width: 73,
        height: 49,
      }}
    />
  );

  const HorizontalLine = () => (
    <i
      style={{
        position: "absolute",
        top: -16,
        left: 36,
        backgroundColor: "#1da57a",
        display: "inline-block",
        width: 2,
        height: 16,
      }}
    />
  );

  const VerticalLine = () => (
    <i
      style={{
        display: "inline-block",
        width: 8,
        height: 2,
        verticalAlign: "middle",
        backgroundColor: "#1da57a",
      }}
    />
  );

  const addProcessFilter = (filter: string) => {
    setProcessFilter([
      ...processFilter,
      { value: filter, relation: RelationType.AND },
    ]);
  };

  useEffect(() => {
    if (processFilter.length < 2) {
      return;
    }
    const finalFilter = {
      combinator: processFilter[1].relation,
      rules: [processFilter[0], processFilter[1]],
    };
    let node = finalFilter.rules;
    for (let i = 2; i < processFilter.length; i += 1) {
      node[1] = {
        combinator: processFilter[i].relation,
        rules: [processFilter[i - 1], processFilter[i]],
      };
      node = node[1].rules;
    }
  }, [processFilter]);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 16, color: "#42526e" }}>
          {formatMessage({
            id: "project.detail.data-center.filter.process-data",
          })}
        </h4>
        {processFilter.map((item, index) => (
          <div
            // TODO make sure the type is unique
            key={item.type}
            style={{
              position: "relative",
              paddingLeft: index === 0 ? 80 : 0,
              marginBottom: 16,
            }}
          >
            {index === 0 && processFilter.length > 1 && <CornerLine />}
            {index > 1 && <HorizontalLine />}
            {index > 0 && (
              <>
                <Select
                  value={item.relation}
                  style={{ width: 72 }}
                  onChange={(value) => {
                    const newProcessFilter = processFilter.slice();
                    newProcessFilter[index].relation = value;
                    setProcessFilter(newProcessFilter);
                  }}
                >
                  {Object.keys(RelationType).map((key) => (
                    <Select.Option key={key} value={RelationType[key]}>
                      {RelationType[key]}
                    </Select.Option>
                  ))}
                </Select>
                <VerticalLine />
              </>
            )}
            <Input
              value={item.value}
              style={{ width: 640, marginRight: 12 }}
              readOnly
            />
            <Button
              icon={<DeleteOutlined />}
              type="link"
              style={{ color: "#F56c6c" }}
              onClick={() =>
                setProcessFilter(
                  processFilter.filter((i, iIndex) => iIndex !== index)
                )
              }
            />
          </div>
        ))}
        <Button
          type="link"
          style={{ marginLeft: 80, padding: 0 }}
          onClick={() => setProcessFilterVisible(true)}
        >
          {formatMessage({ id: "common.add.filter" })}
        </Button>
        <ProcessDataFilterModal
          visible={processFilterVisible}
          onAddFilter={addProcessFilter}
          onClose={() => setProcessFilterVisible(false)}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 16, color: "#42526e" }}>
          {formatMessage({
            id: "project.detail.data-center.filter.origin-data",
          })}
        </h4>
        {columnFilter.map((item, index) => (
          <div
            // TODO make sure the type is unique
            key={item.type}
            style={{
              position: "relative",
              paddingLeft: index === 0 ? 80 : 0,
              marginBottom: 16,
            }}
          >
            {index === 0 && columnFilter.length > 1 && <CornerLine />}
            {index > 1 && <HorizontalLine />}
            {index > 0 && (
              <>
                <Select value={item.relation} style={{ width: 72 }}>
                  {Object.keys(RelationType).map((key) => (
                    <Select.Option key={key} value={RelationType[key]}>
                      {RelationType[key]}
                    </Select.Option>
                  ))}
                </Select>
                <VerticalLine />
              </>
            )}
            <Select
              value={item.type}
              style={{ width: 160, marginRight: 12 }}
              placeholder={formatMessage({ id: "common.select.column" })}
            />
            <Input
              value={item.value}
              style={{ width: 120, marginRight: 12 }}
              onChange={(e) => {
                const newColumnFilter = columnFilter.slice();
                newColumnFilter[index].value = e.target.value;
                setColumnFilter(newColumnFilter);
              }}
              placeholder={formatMessage({ id: "common.input.value" })}
            />
            <Button
              icon={<DeleteOutlined />}
              type="link"
              style={{ color: "#F56c6c" }}
              onClick={() =>
                setColumnFilter(
                  columnFilter.filter((i, iIndex) => iIndex !== index)
                )
              }
            />
          </div>
        ))}
        <Button
          type="link"
          style={{ marginLeft: 80, padding: 0 }}
          onClick={() =>
            setColumnFilter([
              ...columnFilter,
              {
                type: "",
                value: "",
                relation: RelationType.AND,
              },
            ])
          }
        >
          {formatMessage({ id: "common.add.filter" })}
        </Button>
      </div>
    </>
  );
}

export default AdvancedFilter;
