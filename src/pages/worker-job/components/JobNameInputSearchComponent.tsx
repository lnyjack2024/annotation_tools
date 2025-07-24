import { SearchOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";

interface JobNameInputSearchComponentProp {
  jobName: string;
  search: (name: string) => void;
}

export function JobNameInputSearchComponent({
  jobName,
  search,
}: JobNameInputSearchComponentProp) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [name, setName] = useState("");

  useEffect(() => {
    setName(jobName);
  }, [jobName]);

  const jobNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const searchJobs = () => {
    search(name);
  };

  return (
    <Input
      value={name}
      style={{ width: 300, maxWidth: "100%" }}
      placeholder={formatMessage({ id: "task.search.job.name" })}
      onChange={jobNameChange}
      onPressEnter={searchJobs}
      addonAfter={
        <Button
          icon={<SearchOutlined />}
          type="primary"
          style={{ width: 50, margin: "-1px -11px" }}
          onClick={searchJobs}
        />
      }
    />
  );
}
