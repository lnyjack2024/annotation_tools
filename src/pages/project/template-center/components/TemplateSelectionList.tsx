import React, { useEffect, useState } from "react";
import { Row, Col, Spin } from "antd";
import { useIntl } from "@umijs/max";

import { TemplateType } from "@/types/template";
import TemplateMiniCard from "@/pages/project/template-center/components/TemplateMiniCard";
import { getPublicTemplates } from "@/services/template-v3";
import type { ProjectTemplate } from "@/types/v3";

import videoPng from "@/assets/template/video.png";
import adPng from "@/assets/template/ad.png";
import audioPng from "@/assets/template/audio.png";
import excelPng from "@/assets/template/excel.png";
import landmarkPng from "@/assets/template/landmark2.png";
import universalImg from "@/assets/template/universal-img.png";
import lidarPng from "@/assets/template/lidar.png";
import lidarSSEPng from "@/assets/template/lidar-sse.png";
import nerPng from "@/assets/template/ner.png";
import langPng from "@/assets/template/lang.png";
import plssPng from "@/assets/template/plss.png";
import srtPng from "@/assets/template/srt.png";
import customPng from "@/assets/template/custom.png";
import multiChan from "@/assets/template/multi_chan.png";
import conversationPng from "@/assets/template/conversation.png";
import questionAnswer from "@/assets/template/questionAnswer.png";

import styles from "./styles.less";

export enum TemplateCategory {
  LIDAR = "LIDAR",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
  TEXT = "TEXT",
  CUSTOM = "CUSTOM",
}

export const TemplateTypeCategoryMap = {
  [TemplateType.LIDAR]: {
    bg: lidarPng,
    category: TemplateCategory.LIDAR,
  },
  [TemplateType.LIDAR_SSE]: {
    bg: lidarSSEPng,
    category: TemplateCategory.LIDAR,
  },
  [TemplateType.ADVERTISEMENT]: {
    bg: adPng,
    category: TemplateCategory.VIDEO,
  },
  [TemplateType.LANDMARK]: {
    bg: landmarkPng,
    category: TemplateCategory.IMAGE,
  },
  [TemplateType.TRANSCRIPTION]: {
    bg: audioPng,
    category: TemplateCategory.AUDIO,
  },
  [TemplateType.TEXT]: {
    bg: nerPng,
    category: TemplateCategory.TEXT,
  },
  [TemplateType.LLM_CONVERSATION]: {
    bg: conversationPng,
    category: TemplateCategory.TEXT,
  },
  [TemplateType.LLM_QUESTION_ANSWER]: {
    bg: questionAnswer,
    category: TemplateCategory.TEXT,
  },
  [TemplateType.GENERAL_IMAGE]: {
    bg: universalImg,
    category: TemplateCategory.IMAGE,
  },
  [TemplateType.CUSTOM]: {
    bg: customPng,
    category: TemplateCategory.CUSTOM,
  },
};

type Props = {
  categories: string[];
  onTemplatePreview: (templateId: string) => void;
  onTemplateSelect: (templateId: string) => void;
};

type TemplateList = Partial<Record<TemplateCategory, ProjectTemplate[]>>;

const TemplateSelectionList: React.FC<Props> = ({
  categories,
  onTemplatePreview,
  onTemplateSelect,
}) => {
  const { formatMessage } = useIntl();
  const [templates, setTemplates] = useState<TemplateList>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPublicTemplates()
      .then((resp) => {
        const templateMap = resp.data.reduce(
          (acc: TemplateList, cur: ProjectTemplate) => {
            const category = TemplateTypeCategoryMap[cur.type]?.category;
            if (category) {
              if (acc[category]) {
                acc[category].push(cur);
              } else {
                acc[category] = [cur];
              }
            }

            return acc;
          },
          {}
        );

        setTemplates(templateMap);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Spin spinning={loading}>
      <div className={styles["template-list"]}>
        {Object.values(TemplateCategory)
          .filter((type) => categories.includes(type))
          .map((category) => (
            <div key={category} style={{ paddingBottom: 24 }}>
              <h4 id={category}>
                {formatMessage({ id: `tab.${category.toLowerCase()}` })}
              </h4>
              <Row gutter={24}>
                {templates[category]?.map((item: ProjectTemplate) => (
                  <Col key={item.id} style={{ textAlign: "center" }}>
                    <TemplateMiniCard
                      type={item.type}
                      templateId={item.id}
                      bgImage={TemplateTypeCategoryMap[item.type].bg}
                      onTemplateSelect={onTemplateSelect}
                      onTemplatePreview={onTemplatePreview}
                    />
                    <h4>{item.title}</h4>
                  </Col>
                ))}
                {/*{category === TemplateCategory.CUSTOM && (*/}
                {/*  <Col style={{ textAlign: 'center' }}>*/}
                {/*    <TemplateMiniCard*/}
                {/*      templateId={null}*/}
                {/*      type={TemplateType.CUSTOM}*/}
                {/*      bgImage={customPng}*/}
                {/*      onTemplateSelect={onTemplateSelect}*/}
                {/*      onTemplatePreview={onTemplatePreview}*/}
                {/*    />*/}
                {/*  </Col>*/}
                {/*)}*/}
              </Row>
            </div>
          ))}
      </div>
    </Spin>
  );
};

export default TemplateSelectionList;
