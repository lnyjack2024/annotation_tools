import { useEffect, useRef, useState } from "react";
import { Button } from "antd";
import { useIntl } from "@umijs/max";

type TruncateProp = {
  lines?: number;
  html: string;
  className?: string;
};

export default function Truncate({ lines = 6, html, className }: TruncateProp) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const ref = useRef();
  const [shownEllipsis, setShownEllipsis] = useState(false);

  const getLineHeight = (el: any) => {
    const actualHeight = el.getBoundingClientRect?.().height;
    const lineHeightProperty =
      getComputedStyle(el).getPropertyValue("line-height");
    let lineHeight = 0;
    if (String("normal|initial|inherit").indexOf(lineHeightProperty) > -1) {
      lineHeight =
        parseInt(getComputedStyle(el).getPropertyValue("font-size"), 10) + 2;
    } else {
      lineHeight = parseInt(lineHeightProperty, 10);
    }
    return { actualHeight, lineHeight };
  };

  const handleNodes = (
    nodes: HTMLElement[],
    visibleHeight: number,
    visible: boolean
  ) => {
    let totalChildrenHeight = 0;
    nodes.forEach((child) => {
      const elementHeight = child.getBoundingClientRect?.().height;
      if (totalChildrenHeight > visibleHeight) {
        if (child.style) {
          // eslint-disable-next-line no-param-reassign
          child.style.display = visible ? nodes[0].style?.display : "none";
        }
      }
      totalChildrenHeight += elementHeight;
    });
  };

  const handleNodeVisible = (visible: boolean, lineHeight: number) => {
    setShownEllipsis(!visible);
    const childrenNodes = (ref.current as any).childNodes;
    if (childrenNodes.length > 1) {
      handleNodes(childrenNodes, lineHeight, visible);
    } else if (childrenNodes.length === 1) {
      const grandChildren = childrenNodes[0].childNodes;

      if (grandChildren.length > 1) {
        handleNodes(grandChildren, lineHeight, visible);
      } else if (grandChildren[0].nodeType === 3) {
        childrenNodes[0].style.overflow = "hidden";
        childrenNodes[0].style["text-overflow"] = "ellipsis";
        childrenNodes[0].style["-webkit-line-clamp"] = lines;
        childrenNodes[0].style.display = visible ? "inherit" : "-webkit-box";
        childrenNodes[0].style["-webkit-box-orient"] = "vertical";
      }
    }
  };

  useEffect(() => {
    const { actualHeight, lineHeight } = getLineHeight(ref.current);
    if (actualHeight > lineHeight * lines) {
      handleNodeVisible(false, lineHeight * lines);
    }
  }, [lines, html]);

  const showAll = () => {
    const { lineHeight } = getLineHeight(ref.current);
    handleNodeVisible(true, lineHeight);
  };

  return (
    <>
      <div
        ref={ref}
        dangerouslySetInnerHTML={{ __html: html }}
        className={className}
      />
      {shownEllipsis && (
        <Button type="link" onClick={showAll} style={{ paddingLeft: 0 }}>
          {formatMessage({ id: "common.view-all" })}
        </Button>
      )}
    </>
  );
}
