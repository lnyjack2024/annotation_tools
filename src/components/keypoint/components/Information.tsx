import React from 'react';
import { Row, Col } from 'antd';
import formatMessage from '../locales';
import { ShapeInfo } from '../types';
import './Information.scss';

interface Props {
  pointCategory?: string;
  point: ShapeInfo | undefined;
  annotated: number | null;
  total: number | null;
}

export default ({ pointCategory, point, annotated, total }: Props) => (
  <div className="information panel">
    <Row gutter={16}>
      <Col span={14} className="text-right">{formatMessage('INFO_GROUP')}</Col>
      <Col span={10}>{point?.groupName}</Col>
      {pointCategory && (
        <>
          <Col span={14} className="text-right">{formatMessage('INFO_CATEGORY')}</Col>
          <Col span={10}>{pointCategory}</Col>
          <Col span={14} className="text-right">{formatMessage('INFO_POINT')}</Col>
          <Col span={10}>{point?.id}</Col>
          <Col span={14} className="text-right">{formatMessage('INFO_UNLABEL')}</Col>
          <Col span={10}>{(total || 0) - (annotated || 0)}</Col>
        </>
      )}
      <Col span={14} className="text-right">{formatMessage('ANNOTATION_PROGRESS')}</Col>
      <Col span={10}>
        {annotated}
        /
        {total}
      </Col>
    </Row>
  </div>
);
