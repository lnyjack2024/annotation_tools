import React, {
  useState,
  useMemo,
  useContext,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Tabs, Affix } from "antd";
import type { TabsProps } from "antd";
import { useIntl } from "umi";
import TabsContent, { TabsContentHandle } from "./TabsContent";
import { AppContext } from "@/pages/project/template-center/EmbeddedTemplateCreation";
import {
  TabItemConfig,
  TabItemsConfig,
  TabKey,
} from "../JobTemplateEditor/tool-config/templates/tabs";

interface Props {
  tabItemsConfig?: TabItemsConfig;
  onFinish: () => void;
}
export interface TabsBarHandle {
  updateCurrentTabValues: () => Promise<any>;
}

export const TabsBar = forwardRef<TabsBarHandle, Props>(
  ({ tabItemsConfig, onFinish }, ref) => {
    const { formatMessage } = useIntl();
    const { templateInfo, locale } = useContext(AppContext);
    const [activeKey, setActiveKey] = useState<string>(TabKey.BASIC_INFO);
    const tabItemKeys = tabItemsConfig ? Object.values(tabItemsConfig) : [];

    const tabsContentBasicInfoRef = useRef<TabsContentHandle>(null);
    const tabsContentDataSourceRef = useRef<TabsContentHandle>(null);
    const tabsContentLabelSubjectRef = useRef<TabsContentHandle>(null);
    const tabsContentLabelViewRef = useRef<TabsContentHandle>(null);
    const tabsContentLabelAssistRef = useRef<TabsContentHandle>(null);
    const tabsContentLabelCheckRef = useRef<TabsContentHandle>(null);
    const tabsContentQARef = useRef<TabsContentHandle>(null);
    const tabsContentRefMap: { [refKey: string]: React.RefObject<any> } = {
      [TabKey.BASIC_INFO]: tabsContentBasicInfoRef,
      [TabKey.DATA_SOURCE]: tabsContentDataSourceRef,
      [TabKey.LABEL_SUBJECT]: tabsContentLabelSubjectRef,
      [TabKey.LABEL_VIEW]: tabsContentLabelViewRef,
      [TabKey.LABEL_ASSIST]: tabsContentLabelAssistRef,
      [TabKey.LABEL_CHECK]: tabsContentLabelCheckRef,
      [TabKey.QA]: tabsContentQARef,
    };
    const templateConfigTop = useRef<number>(0);

    useEffect(() => {
      const top = (document.querySelector(".template-config") as HTMLDivElement)
        ?.offsetTop;
      templateConfigTop.current = top;
    }, []);

    const scrollContentTop = () => {
      const scrollTop = document.querySelector("html")?.scrollTop || 0;
      if (scrollTop > templateConfigTop?.current) {
        document
          .querySelector("html")
          ?.scrollTo(0, templateConfigTop?.current + 24);
      }
    };

    const updateCurrentTabValues = () => {
      return tabsContentRefMap[activeKey].current?.refMap?.[
        activeKey
      ]?.current?.updateValues();
    };
    useImperativeHandle(
      ref,
      () => ({
        updateCurrentTabValues,
      }),
      [activeKey, tabsContentRefMap]
    );

    const onNext = (curIndex: number) => {
      if (curIndex + 1 < tabItemKeys.length) {
        setActiveKey(tabItemKeys[curIndex + 1].key);
        scrollContentTop();
      }
    };

    const onPrev = (curIndex: number) => {
      if (curIndex > 0) {
        setActiveKey(tabItemKeys[curIndex - 1].key);
        scrollContentTop();
      }
    };

    const onFinishHandle = () => {
      if (onFinish) {
        onFinish();
      }
    };

    const items = useMemo(() => {
      if (!templateInfo) {
        return [];
      }
      return tabItemKeys.map((item: TabItemConfig, index: number) => {
        return {
          label: formatMessage({ id: item.titleKey }),
          key: item.key,
          forceRender: true,
          children: (
            <TabsContent
              templateType={templateInfo.type}
              ref={tabsContentRefMap[item.key]}
              tabItem={item}
              onNext={() => onNext(index)}
              onPrev={() => onPrev(index)}
              onFinish={onFinishHandle}
            />
          ),
        };
      });
    }, [templateInfo, locale]);

    const renderTabBar: TabsProps["renderTabBar"] = (props, DefaultTabBar) => (
      <Affix style={{ zIndex: 1 }} offsetTop={48}>
        {React.createElement(DefaultTabBar, props)}
      </Affix>
    );

    return (
      <Tabs
        activeKey={activeKey}
        tabPosition="left"
        items={items}
        onTabClick={(key: string) => {
          tabsContentRefMap[activeKey].current?.refMap?.[activeKey]?.current
            ?.updateValues()
            .then((res: string) => {
              if (res === "success") {
                setActiveKey(key);
                scrollContentTop();
              }
            });
        }}
        renderTabBar={renderTabBar}
      />
    );
  }
);
