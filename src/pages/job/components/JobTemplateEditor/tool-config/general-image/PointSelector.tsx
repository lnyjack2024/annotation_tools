import { Dropdown, Row, Col } from "antd";
import { useIntl } from "@umijs/max";
import cx from "classnames";
import dot from "./icons/point-dot.svg";
import triangle from "./icons/point-triangle.svg";
import rectangle from "./icons/point-rectangle.svg";
import trapezoid from "./icons/point-trapezoid.svg";
import rhombus from "./icons/point-rhombus.svg";
import pentagon from "./icons/point-pentagon.svg";
import star from "./icons/point-star.svg";
import asterisk from "./icons/point-asterisk.svg";
import styles from "./styles.less";

interface PointSelectorProps {
  style?: React.CSSProperties;
  value?: string;
  onChange?: (pointType: string) => void;
}

const pointImages = {
  dot,
  triangle,
  rectangle,
  trapezoid,
  rhombus,
  pentagon,
  star,
  asterisk,
};

const PointSelector: React.FC<PointSelectorProps> = ({
  style,
  value,
  onChange,
}) => {
  const { formatMessage } = useIntl();
  return (
    <Dropdown
      trigger={["click"]}
      overlay={() => (
        <div className={styles["point-selector"]}>
          <div style={{ marginBottom: 8 }}>
            {formatMessage({
              id: "tool.general-image.child.custom.point.dropdown",
            })}
          </div>
          <Row gutter={6}>
            {[
              "dot",
              "triangle",
              "rectangle",
              "trapezoid",
              "rhombus",
              "pentagon",
              "star",
              "asterisk",
            ].map((t) => (
              <Col key={t} span={6}>
                <div
                  className={cx(styles["point-selector-item"], {
                    [styles.selected]: t === value,
                  })}
                  onClick={() => {
                    if (onChange) {
                      onChange(t);
                    }
                  }}
                >
                  <img src={pointImages[t]} />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #DCDFE3",
          borderRadius: 2,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          ...style,
        }}
      >
        <img src={pointImages[value]} />
      </div>
    </Dropdown>
  );
};

export default PointSelector;
