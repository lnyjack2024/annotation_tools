/* eslint-disable no-param-reassign */
export const objectType = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};
export const isDefined = (param: any) => {
  return typeof param != "undefined";
};
export const isUndefined = (param: any) => {
  return typeof param == "undefined";
};
export const isFunction = (param: any) => {
  return typeof param == "function";
};
export const isNumber = (param: number) => {
  return typeof param == "number" && !isNaN(param);
};
export const isString = (str: any) => {
  return objectType(str) === "String";
};
export const isArray = (arr: any) => {
  return objectType(arr) === "Array";
};

export const closest = (
  target: { matches: (arg0: any) => any; parentNode: any },
  selector: string
) => {
  // closest(e.target, '.field')
  while (target) {
    if (target.matches && target.matches(selector)) return target;
    target = target.parentNode;
  }
  return null;
};

export const getOffsetRect = (elem: { getBoundingClientRect: () => any }) => {
  // (1)
  const box = elem.getBoundingClientRect();

  const body = document.body;
  const docElem = document.documentElement;

  // (2)
  const scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
  const scrollLeft =
    window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

  // (3)
  const clientTop = docElem.clientTop || body.clientTop || 0;
  const clientLeft = docElem.clientLeft || body.clientLeft || 0;

  // (4)
  const top = box.top + scrollTop - clientTop;
  const left = box.left + scrollLeft - clientLeft;

  return { top: Math.round(top), left: Math.round(left) };
};

export const getTotalScroll = (elem: {
  parentNode: { parentNode: any; scrollTop: any; scrollLeft: any };
  scrollTop: any;
  scrollLeft: any;
}) => {
  let top = 0;
  let left = 0;

  while ((elem = elem.parentNode)) {
    top += elem.scrollTop || 0;
    left += elem.scrollLeft || 0;
  }

  return { top, left };
};

export const getTransformProps = (x: number, y: number) => {
  return {
    transform: "translate(" + x + "px, " + y + "px)",
  };
};

export const listWithChildren = (
  list: any[],
  childrenProp: string | number
): any[] => {
  return list.map((item: Record<string, any>) => {
    return {
      ...item,
      [childrenProp]: item[childrenProp]
        ? listWithChildren(item[childrenProp], childrenProp)
        : [],
    };
  });
};

export const getAllNonEmptyNodesIds = (
  items: any[],
  { idProp, childrenProp }: { idProp: any; childrenProp: any }
) => {
  let childrenIds: any[] = [];
  const ids = items
    .filter((item: Record<string, string | any[]>) => item[childrenProp].length)
    .map((item: Record<string, any>) => {
      childrenIds = childrenIds.concat(
        getAllNonEmptyNodesIds(item[childrenProp], { idProp, childrenProp })
      );
      return item[idProp];
    });

  return ids.concat(childrenIds);
};
