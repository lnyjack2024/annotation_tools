import React, { useState } from "react";
import { Input, Button } from "antd";
import { useIntl } from "@umijs/max";

const inputItemStyle = {
  marginRight: 10,
  marginBottom: 15,
  width: 280,
};

type Filter = {
  projectDisplayId?: string;
  search?: string;
};

type Props = {
  onSearch?: (filter: Filter) => void;
  onReset?: () => void;
  initialValue?: Filter;
  projectNamePlaceholder?: string;
  projectDisplayIdPlaceholder?: string;
};

const ProjectListFilter: React.FC<Props> = ({
  initialValue,
  onSearch,
  onReset,
  projectNamePlaceholder,
  projectDisplayIdPlaceholder,
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [filter, setFilter] = useState<Filter>({ ...initialValue });

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Input
        placeholder={
          projectNamePlaceholder || formatMessage({ id: "projectName" })
        }
        style={inputItemStyle}
        value={filter.search}
        onChange={(e) => {
          const projectName = e.target.value;
          setFilter({
            ...filter,
            search: projectName,
          });
        }}
      />
      <Input
        placeholder={
          projectDisplayIdPlaceholder ||
          formatMessage({ id: "projectDisplayId" })
        }
        style={inputItemStyle}
        value={filter.projectDisplayId}
        onChange={(e) => {
          const projectDisplayId = e.target.value;

          setFilter({
            ...filter,
            projectDisplayId,
          });
        }}
      />
      <Button
        type="primary"
        style={{ marginLeft: 8 }}
        onClick={(e) => {
          e.preventDefault();
          if (onSearch) {
            onSearch(filter);
          }
        }}
      >
        {formatMessage({ id: "common.search" })}
      </Button>
      <Button
        style={{ marginLeft: 16 }}
        onClick={(e) => {
          e.preventDefault();
          if (onReset) {
            setFilter({});
            onReset();
          }
        }}
      >
        {formatMessage({ id: "common.reset" })}
      </Button>
    </div>
  );
};

export default ProjectListFilter;
