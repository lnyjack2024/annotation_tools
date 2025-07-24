import { Dropdown } from "antd";
import { useIntl } from "@umijs/max";
import cx from "classnames";
import straight from "./icons/edge-straight.svg";
import broken from "./icons/edge-broken.svg";
import wavy from "./icons/edge-wavy.svg";
import styles from "./styles.less";

interface EdgeSelectorProps {
  value?: string;
  onChange?: (pointType: string) => void;
}

const edgeImages = {
  straight,
  broken,
  wavy,
};

const EdgeSelector: React.FC<EdgeSelectorProps> = ({ value, onChange }) => {
  const { formatMessage } = useIntl();
  return (
    <Dropdown
      trigger={["click"]}
      overlay={() => (
        <div className={styles["edge-selector"]}>
          <div style={{ marginBottom: 8 }}>
            {formatMessage({
              id: "tool.general-image.child.custom.edge.dropdown",
            })}
          </div>
          {["straight", "broken", "wavy"].map((t) => (
            <div
              key={t}
              className={cx(styles["edge-selector-item"], {
                [styles.selected]: t === value,
              })}
              onClick={() => {
                if (onChange) {
                  onChange(t);
                }
              }}
            >
              <div style={{ backgroundImage: `url(${edgeImages[t]})` }} />
            </div>
          ))}
        </div>
      )}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #DCDFE3",
          borderRadius: 2,
          width: 88,
          padding: "0 18px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: "100%",
            height: 32,
            backgroundImage: `url(${edgeImages[value]})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
      </div>
    </Dropdown>
  );
};

export default EdgeSelector;
