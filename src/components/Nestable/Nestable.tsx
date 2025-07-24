import React, { PureComponent } from "react";
import cx from "classnames";
import update from "immutability-helper";
import { isEqual } from "lodash";
import {
  isArray,
  closest,
  getOffsetRect,
  getTotalScroll,
  getTransformProps,
  listWithChildren,
  getAllNonEmptyNodesIds,
} from "./utils";
import NestableItem from "./NestableItem";

type Item = Record<string, any>;

type NestableProps = {
  childrenProp?: string;
  className?: string;
  collapsed?: boolean;
  confirmChange?: (arg: {
    dragItem: Item;
    destinationParent: Item | null;
  }) => boolean;
  group?: number | string;
  handler?: React.ReactNode;
  idProp?: string;
  items?: Item[];
  maxDepth?: number;
  onChange?: (arg: {
    items?: any[];
    dragItem?: any;
    targetPath?: number[];
  }) => void;
  renderCollapseIcon?: (arg: { isCollapsed: boolean }) => React.ReactNode;
  renderItem?: (arg: {
    collapseIcon: React.ReactNode;
    depth: number;
    handler: React.ReactNode;
    index: number;
    item: Item;
  }) => React.ReactNode;
  threshold?: number;
};

type NestableState = {
  items?: Item[];
  itemsOld?: Item[] | null; // snap copy in case of canceling drag
  dragItem?: Item | null;
  isDirty?: boolean;
  collapsedGroups?: any[];
};

class Nestable extends PureComponent<NestableProps, NestableState> {
  static defaultProps = {
    childrenProp: "children",
    collapsed: false,
    confirmChange: () => true,
    group: Math.random().toString(36).slice(2),
    idProp: "id",
    items: [],
    maxDepth: 10,
    onChange: () => {},
    renderItem: ({ item }: { item: Item }) => String(item),
    threshold: 30,
  };

  el: any = null;
  elCopyStyles: any = null;
  mouse: { last: { x: number }; shift: { x: number } } = {
    last: { x: 0 },
    shift: { x: 0 },
  };
  state: NestableState = {
    isDirty: false,
    items: [],
    itemsOld: null,
    dragItem: null,
    collapsedGroups: [],
  };

  componentDidMount() {
    let { items } = this.props;
    const { childrenProp = "children" } = this.props;

    // make sure every item has property 'children'
    items = listWithChildren(items, childrenProp);

    this.setState({ items });
  }

  componentDidUpdate(prevProps: NestableProps) {
    const { items: itemsNew, childrenProp } = this.props;
    const isPropsUpdated = !isEqual(prevProps, this.props);
    if (isPropsUpdated) {
      this.stopTrackMouse();

      const extra: { collapsedGroups?: any[] } = {};

      if (prevProps.collapsed !== this.props.collapsed) {
        extra.collapsedGroups = [];
      }

      this.setState({
        items: listWithChildren(itemsNew, childrenProp),
        dragItem: null,
        isDirty: false,
        ...extra,
      });
    }
  }

  componentWillUnmount() {
    this.stopTrackMouse();
  }

  collapse = (itemIds: string | any[]) => {
    const { idProp, childrenProp, collapsed } = this.props;
    const { items } = this.state;

    if (itemIds === "NONE") {
      this.setState({
        collapsedGroups: collapsed
          ? getAllNonEmptyNodesIds(items, { idProp, childrenProp })
          : [],
      });
    } else if (itemIds === "ALL") {
      this.setState({
        collapsedGroups: collapsed
          ? []
          : getAllNonEmptyNodesIds(items, { idProp, childrenProp }),
      });
    } else if (isArray(itemIds)) {
      this.setState({
        collapsedGroups: getAllNonEmptyNodesIds(items, {
          idProp,
          childrenProp,
        }).filter((id) => itemIds.indexOf(id) > -1 !== collapsed),
      });
    }
  };

  startTrackMouse = () => {
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onDragEndHandler);
    document.addEventListener("keydown", this.onKeyDown);
  };

  stopTrackMouse = () => {
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onDragEndHandler);
    document.removeEventListener("keydown", this.onKeyDown);
    this.elCopyStyles = null;
  };

  moveItem(
    {
      dragItem,
      pathFrom,
      pathTo,
    }: { dragItem: Item; pathFrom: number[]; pathTo: number[] },
    extraProps = {}
  ) {
    const { childrenProp, confirmChange } = this.props;
    const dragItemSize = this.getItemDepth(dragItem);
    let { items } = this.state;

    // the remove action might affect the next position,
    // so update next coordinates accordingly
    const realPathTo = this.getRealNextPath(pathFrom, pathTo, dragItemSize);

    if (realPathTo.length === 0) return;

    // user can validate every movement
    const destinationPath =
      realPathTo.length > pathTo.length ? pathTo : pathTo.slice(0, -1);
    const destinationParent = this.getItemByPath(destinationPath);
    if (!confirmChange({ dragItem, destinationParent })) return;

    const removePath = this.getSplicePath(pathFrom, {
      numToRemove: 1,
      childrenProp: childrenProp,
    });

    const insertPath = this.getSplicePath(realPathTo, {
      numToRemove: 0,
      itemsToInsert: [dragItem],
      childrenProp: childrenProp,
    });
    items = update(items, removePath);
    items = update(items, insertPath);

    this.setState({
      items,
      isDirty: true,
      ...extraProps,
    });
  }

  tryIncreaseDepth(dragItem: Item) {
    const { maxDepth, idProp, childrenProp, collapsed } = this.props;
    const pathFrom = this.getPathById(dragItem[idProp]);
    const itemIndex = pathFrom[pathFrom.length - 1];
    const newDepth = pathFrom.length + this.getItemDepth(dragItem);

    // has previous sibling and isn't at max depth
    if (itemIndex > 0 && newDepth <= maxDepth) {
      const prevSibling = this.getItemByPath(
        pathFrom.slice(0, -1).concat(itemIndex - 1)
      );

      // previous sibling is not collapsed
      if (!prevSibling[childrenProp].length || !this.isCollapsed(prevSibling)) {
        const pathTo = pathFrom
          .slice(0, -1)
          .concat(itemIndex - 1)
          .concat(prevSibling[childrenProp].length);

        // if collapsed by default
        // and was no children here
        // open this node
        let collapseProps = {};
        if (collapsed && !prevSibling[childrenProp].length) {
          collapseProps = this.onToggleCollapse(prevSibling, true);
        }

        this.moveItem({ dragItem, pathFrom, pathTo }, collapseProps);
      }
    }
  }

  tryDecreaseDepth(dragItem: Item) {
    const { idProp, childrenProp, collapsed } = this.props;
    const pathFrom = this.getPathById(dragItem[idProp]);
    const itemIndex = pathFrom[pathFrom.length - 1];

    // has parent
    if (pathFrom.length > 1) {
      const parent = this.getItemByPath(pathFrom.slice(0, -1));

      // is last (by order) item in array
      if (itemIndex + 1 === parent[childrenProp].length) {
        const pathTo = pathFrom.slice(0, -1);
        pathTo[pathTo.length - 1] += 1;

        // if collapsed by default
        // and is last (by count) item in array
        // remove this node from list of open nodes
        let collapseProps = {};
        if (collapsed && parent[childrenProp].length === 1) {
          collapseProps = this.onToggleCollapse(parent, true);
        }

        this.moveItem({ dragItem, pathFrom, pathTo }, collapseProps);
      }
    }
  }

  dragApply() {
    const { onChange, idProp } = this.props;
    const { items, isDirty, dragItem } = this.state;

    this.setState({
      itemsOld: null,
      dragItem: null,
      isDirty: false,
    });

    if (onChange && isDirty) {
      const targetPath = this.getPathById(dragItem[idProp], items);
      onChange({ items, dragItem, targetPath });
    }
  }

  dragRevert() {
    const { itemsOld } = this.state;

    this.setState({
      items: itemsOld,
      itemsOld: null,
      dragItem: null,
      isDirty: false,
    });
  }

  // ––––––––––––––––––––––––––––––––––––
  // Getter methods
  // ––––––––––––––––––––––––––––––––––––
  getPathById(id: string, items = this.state.items) {
    const { idProp, childrenProp } = this.props;
    let path: number[] = [];

    items.every((item, i) => {
      if (item[idProp] === id) {
        path.push(i);
      } else if (item[childrenProp]) {
        const childrenPath = this.getPathById(id, item[childrenProp]);

        if (childrenPath.length) {
          path = path.concat(i).concat(childrenPath);
        }
      }

      return path.length === 0;
    });

    return path;
  }

  getItemByPath(path: number[], items = this.state.items): Item {
    const { childrenProp } = this.props;
    let item: Item = null;

    path.forEach((index) => {
      const list = item ? item[childrenProp] : items;
      item = list[index];
    });

    return item;
  }

  getItemDepth = (item: Item) => {
    const { childrenProp } = this.props;
    let level = 1;

    if (item[childrenProp].length > 0) {
      const childrenDepths = item[childrenProp].map(this.getItemDepth);
      level += Math.max(...childrenDepths);
    }

    return level;
  };

  getSplicePath(
    path: number[],
    options: {
      numToRemove?: number;
      itemsToInsert?: Item[];
      childrenProp?: string;
    } = {}
  ) {
    const splicePath = {};
    const numToRemove = options.numToRemove || 0;
    const itemsToInsert = options.itemsToInsert || [];
    const lastIndex = path.length - 1;
    let currentPath = splicePath;

    path.forEach((index, i) => {
      if (i === lastIndex) {
        currentPath.$splice = [[index, numToRemove, ...itemsToInsert]];
      } else {
        const nextPath = {};
        currentPath[index] = { [options.childrenProp]: nextPath };
        currentPath = nextPath;
      }
    });

    return splicePath;
  }

  getRealNextPath(
    prevPath: number[],
    nextPath: number[],
    dragItemSize: number
  ): number[] {
    const { childrenProp, maxDepth } = this.props;
    const ppLastIndex = prevPath.length - 1;
    const npLastIndex = nextPath.length - 1;
    const newDepth = nextPath.length + dragItemSize - 1;

    if (prevPath.length < nextPath.length) {
      // move into depth
      let wasShifted = false;

      // if new depth exceeds max, try to put after item instead of into item
      if (newDepth > maxDepth && nextPath.length) {
        return this.getRealNextPath(
          prevPath,
          nextPath.slice(0, -1),
          dragItemSize
        );
      }

      return nextPath.map((nextIndex, i) => {
        if (wasShifted) {
          return i === npLastIndex ? nextIndex + 1 : nextIndex;
        }

        if (typeof prevPath[i] !== "number") {
          return nextIndex;
        }

        if (nextPath[i] > prevPath[i] && i === ppLastIndex) {
          wasShifted = true;
          return nextIndex - 1;
        }

        return nextIndex;
      });
    } else if (prevPath.length === nextPath.length) {
      // if move bottom + move to item with children --> make it a first child instead of swap
      if (nextPath[npLastIndex] > prevPath[npLastIndex]) {
        const target = this.getItemByPath(nextPath);

        if (
          newDepth < maxDepth &&
          target[childrenProp] &&
          target[childrenProp].length &&
          !this.isCollapsed(target)
        ) {
          return nextPath
            .slice(0, -1)
            .concat(nextPath[npLastIndex] - 1)
            .concat(0);
        }
      }
    }

    return nextPath;
  }

  getItemOptions() {
    const { renderItem, renderCollapseIcon, handler, idProp, childrenProp } =
      this.props;
    const { dragItem } = this.state;

    return {
      dragItem,
      idProp,
      childrenProp,
      renderItem,
      renderCollapseIcon,
      handler,

      onDragStart: this.onDragStart,
      onMouseEnter: this.onMouseEnter,
      isCollapsed: this.isCollapsed,
      onToggleCollapse: this.onToggleCollapse,
    };
  }

  isCollapsed = (item: Item) => {
    const { collapsed, idProp } = this.props;
    const { collapsedGroups } = this.state;

    return !!(collapsedGroups.indexOf(item[idProp]) > -1 !== collapsed);
  };

  onDragStart = (e: MouseEvent, item: Item) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.el = closest(e.target as any, ".nestable-item");

    this.startTrackMouse();
    this.onMouseMove(e);

    this.setState({
      dragItem: item,
      itemsOld: this.state.items,
    });
  };

  onDragEndHandler = (e: MouseEvent) => {
    this.onDragEnd(e, null);
  };

  onDragEnd = (e: MouseEvent, isCancel: boolean) => {
    e.preventDefault();

    this.stopTrackMouse();
    this.el = null;

    if (isCancel) {
      this.dragRevert();
    } else {
      this.dragApply();
    }
  };

  onMouseMove = (e: MouseEvent) => {
    const { group, threshold } = this.props;
    const { dragItem } = this.state;
    const { clientX, clientY } = e;
    const transformProps = getTransformProps(clientX, clientY);
    const elCopy = document.querySelector(
      ".nestable-" + group + " .nestable-drag-layer > .nestable-list"
    );

    if (!this.elCopyStyles) {
      const offset = getOffsetRect(this.el);
      const scroll = getTotalScroll(this.el);

      this.elCopyStyles = {
        marginTop: offset.top - clientY - scroll.top,
        marginLeft: offset.left - clientX - scroll.left,
        ...transformProps,
      };
    } else {
      this.elCopyStyles = {
        ...this.elCopyStyles,
        ...transformProps,
      };
      for (const key in transformProps) {
        if (transformProps.hasOwnProperty(key)) {
          (elCopy as any).style[key] = transformProps[key];
        }
      }

      const diffX = clientX - this.mouse.last.x;
      if (
        (diffX >= 0 && this.mouse.shift.x >= 0) ||
        (diffX <= 0 && this.mouse.shift.x <= 0)
      ) {
        this.mouse.shift.x += diffX;
      } else {
        this.mouse.shift.x = 0;
      }
      this.mouse.last.x = clientX;

      if (Math.abs(this.mouse.shift.x) > threshold) {
        if (this.mouse.shift.x > 0) {
          this.tryIncreaseDepth(dragItem);
        } else {
          this.tryDecreaseDepth(dragItem);
        }

        this.mouse.shift.x = 0;
      }
    }
  };

  onMouseEnter = (e: MouseEvent, item: Item) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const { collapsed, idProp, childrenProp } = this.props;
    const { dragItem } = this.state;
    if (dragItem[idProp] === item[idProp]) return;

    const pathFrom = this.getPathById(dragItem[idProp]);
    const pathTo = this.getPathById(item[idProp]);

    // if collapsed by default
    // and move last (by count) child
    // remove parent node from list of open nodes
    let collapseProps = {};
    if (collapsed && pathFrom.length > 1) {
      const parent = this.getItemByPath(pathFrom.slice(0, -1));
      if (parent[childrenProp].length === 1) {
        collapseProps = this.onToggleCollapse(parent, true);
      }
    }

    this.moveItem({ dragItem, pathFrom, pathTo }, collapseProps);
  };

  onToggleCollapse = (item: Item, isGetter: boolean) => {
    const { collapsed, idProp } = this.props;
    const { collapsedGroups } = this.state;
    const isCollapsed = this.isCollapsed(item);

    const newState = {
      collapsedGroups:
        isCollapsed !== collapsed
          ? collapsedGroups.filter((id) => id !== item[idProp])
          : collapsedGroups.concat(item[idProp]),
    };

    if (isGetter) {
      return newState;
    } else {
      this.setState(newState);
    }
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (e.which === 27) {
      // ESC
      this.onDragEnd(null, true);
    }
  };

  renderDragLayer() {
    const { group, idProp } = this.props;
    const { dragItem } = this.state;
    const el = document.querySelector(
      ".nestable-" + group + " .nestable-item-" + dragItem[idProp]
    );

    let listStyles = {};
    if (el) {
      listStyles.width = el.clientWidth;
    }
    if (this.elCopyStyles) {
      listStyles = {
        ...listStyles,
        ...this.elCopyStyles,
      };
    }

    const options = this.getItemOptions();

    return (
      <div className="nestable-drag-layer">
        <ol className="nestable-list" style={listStyles}>
          <NestableItem
            item={dragItem}
            options={options}
            isCopy
            index={0}
            depth={0}
          />
        </ol>
      </div>
    );
  }

  render() {
    const { group, className } = this.props;
    const { items, dragItem } = this.state;
    const options = this.getItemOptions();

    return (
      <div
        className={cx(className, "nestable", "nestable-" + group, {
          "is-drag-active": dragItem,
        })}
      >
        <ol className="nestable-list nestable-group">
          {items.map((item, i) => {
            return (
              <NestableItem
                key={item[options.idProp || "id"]}
                index={i}
                item={item}
                options={options}
              />
            );
          })}
        </ol>

        {dragItem && this.renderDragLayer()}
      </div>
    );
  }
}

export default Nestable;
