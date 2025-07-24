import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import cx from "classnames";

type Item = Record<string, any>;
type NestableItemProps = {
  item: Item;
  isCopy?: boolean;
  options: any;
  index: number;
  depth?: number;
};

const NestableItem = ({
  item,
  isCopy,
  options,
  index,
  depth = 0,
}: NestableItemProps) => {
  const renderCollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <span className={cx("nestable-icon", "nestable-item-icon")}>
      {isCollapsed ? <PlusCircleOutlined /> : <MinusCircleOutlined />}
    </span>
  );

  const {
    dragItem,
    renderItem,
    handler,
    idProp = "id",
    childrenProp = "children",
    isCollapsed: isCollapsedFun,
  } = options;
  const isCollapsed = isCollapsedFun(item);
  const isDragging = !isCopy && dragItem && dragItem[idProp] === item[idProp];
  const hasChildren = item[childrenProp] && item[childrenProp].length > 0;

  let rowProps = {};
  let handlerProps = {};
  let wrappedHandler;

  if (!isCopy) {
    if (dragItem) {
      rowProps = {
        ...rowProps,
        onMouseEnter: (e: MouseEvent) => options.onMouseEnter(e, item),
      };
    } else {
      handlerProps = {
        ...handlerProps,
        draggable: true,
        onDragStart: (e: MouseEvent) => options.onDragStart(e, item),
      };
    }
  }

  if (handler) {
    wrappedHandler = (
      <span className="nestable-item-handler" {...handlerProps}>
        {handler}
      </span>
    );
    // wrappedHandler = React.cloneElement(handler, handlerProps);
  } else {
    rowProps = {
      ...rowProps,
      ...handlerProps,
    };
  }

  const collapseIcon = hasChildren ? (
    <span onClick={() => options.onToggleCollapse(item)}>
      {renderCollapseIcon({ isCollapsed })}
    </span>
  ) : null;

  const baseClassName = "nestable-item" + (isCopy ? "-copy" : "");
  const itemProps = {
    className: cx(baseClassName, baseClassName + "-" + item[idProp], {
      "is-dragging": isDragging,
      [baseClassName + "--with-children"]: hasChildren,
      [baseClassName + "--children-open"]: hasChildren && !isCollapsed,
      [baseClassName + "--children-collapsed"]: hasChildren && isCollapsed,
    }),
  };

  const content = renderItem({
    collapseIcon,
    depth,
    handler: wrappedHandler,
    index,
    item,
  });

  if (!content) return null;

  return (
    <li {...itemProps}>
      <div className="nestable-item-name" {...rowProps}>
        {content}
      </div>

      {hasChildren && !isCollapsed && (
        <ol className="nestable-list">
          {item[childrenProp].map((itemSub: Item, i: number) => {
            return (
              <NestableItem
                key={itemSub[idProp]}
                index={i}
                depth={depth + 1}
                item={itemSub}
                options={options}
                isCopy={isCopy}
              />
            );
          })}
        </ol>
      )}
    </li>
  );
};

export default NestableItem;
