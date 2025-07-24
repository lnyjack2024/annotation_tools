import { Tag } from "antd";
import { useIntl } from "@umijs/max";
import Popover from "antd/lib/popover";
import style from "@/pages/bpo/superadmin/Style.less";
import globalStyles from "@/global.less";

export type Tag = {
  id: string;
  name: string;
};

export default function BPOTagComponent({ tags }: { tags: Tag[] }) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const tagTemplate = (items: Tag[]) => (
    <>
      {items.map((item) => (
        <Tag key={item.id} className={`${style.bpoTag} text-ellipsis`}>
          {item.name}
        </Tag>
      ))}
    </>
  );
  return (
    <>
      {tags.length <= 3 ? (
        tagTemplate(tags)
      ) : (
        <Popover
          content={<div style={{ width: 400 }}>{tagTemplate(tags)}</div>}
          trigger="hover"
          placement="topRight"
        >
          <span
            className={globalStyles["primary-color"]}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            {tagTemplate(tags.slice(0, 3))}
            <span style={{ marginLeft: 5 }}>
              {formatMessage({ id: "common.etc" }, { count: tags.length })}
            </span>
          </span>
        </Popover>
      )}
    </>
  );
}
