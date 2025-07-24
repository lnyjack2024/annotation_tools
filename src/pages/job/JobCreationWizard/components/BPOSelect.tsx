import React, { useEffect, useState } from "react";
import { message, Select } from "antd";
import { useIntl } from "@umijs/max";

import { getAllBPO } from "@/services/bpo";
import type { BPO } from "@/types/vm";

import "../styles.less";
import styles from "../styles.less";

type Props = {
  value?: string;
  bpoId?: string;
  width?: number | string;
  onLoadComplete?: () => void;
  projectId: string;
  onChange?: (bpoId: string, bpo: BPO) => void;
};

const BPOSelect: React.FC<Props> = ({
  value,
  bpoId,
  projectId,
  onChange,
  width = 640,
  onLoadComplete,
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [bpoList, setBPOList] = useState([]);

  const BPOSelectOptionContent = ({ bpoInfo }: { bpoInfo: any }) => (
    <div className={styles["bpo-select"]}>
      <table width="100%">
        <tbody>
          <tr>
            <td width="50%">
              <span className={styles["option-label"]}>
                {formatMessage({ id: "common.id" })}
              </span>
              <span>{bpoInfo.bpoDisplayId}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <table width="100%">
        <tbody>
          <tr>
            <td width="50%">
              <span className={styles["option-label"]}>
                {formatMessage({ id: "common.name" })}
              </span>
              <span>{bpoInfo.name || bpoInfo.bpoName}</span>
            </td>
            <td width="50%">
              <span className={styles["option-label"]}>
                {formatMessage({ id: "job-detail.contact" })}
              </span>
              <span>{bpoInfo.contact || bpoInfo.contactName}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <table width="100%">
        <tbody>
          <tr>
            <td width="50%">
              <span className={styles["option-label"]}>
                {formatMessage({ id: "common.email" })}
              </span>
              <span>{bpoInfo.contactEmail}</span>
            </td>
            <td width="50%">
              <span className={styles["option-label"]}>
                {formatMessage({ id: "common.word.phone" })}
              </span>
              <span>{bpoInfo.contactPhone}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  useEffect(() => {
    getAllBPO()
      .then((resp) => {
        setBPOList(resp.data);
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        if (onLoadComplete) {
          onLoadComplete();
        }
      });
  }, [projectId]);

  const searchBpo = (input: string, option: Record<string, any>) => {
    const { contactEmail, contactPhone, name, bpoName, contact, contactName } =
      option?.children?.props?.bpoInfo;

    return (
      (contactEmail && contactEmail.indexOf(input) > -1) ||
      (contactPhone && contactPhone.indexOf(input) > -1) ||
      (name && name.indexOf(input) > -1) ||
      (bpoName && bpoName.indexOf(input) > -1) ||
      (contact && contact.indexOf(input) > -1) ||
      (contactName && contactName.indexOf(input) > -1)
    );
  };

  return (
    <Select
      showSearch
      defaultValue={value || bpoId}
      style={{ width }}
      optionLabelProp="label"
      filterOption={searchBpo}
      onChange={(id) => {
        onChange(
          id,
          bpoList.find((item) => item.id === id || item.bpoId === id)
        );
      }}
    >
      {bpoList.map((item) => (
        <Select.Option
          key={item.id || item.bpoId}
          value={item.id || item.bpoId}
          label={`${item.name || item.bpoName} - ${
            item.contact || item.contactName
          }`}
        >
          <BPOSelectOptionContent bpoInfo={item} />
        </Select.Option>
      ))}
    </Select>
  );
};

export default BPOSelect;
