import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Select, Button, Radio, Form, Row, Col, message } from 'antd';
import { ImageTextField } from '@appen-china/easy-form';
import Modal from '../../../common/modal/Modal';
import ImagePreview from '../../../common/modal/ImagePreview';
import { ReviewResult, Review, ReviewData, ShapeInfo } from '../../types';
import formatMessage from '../../locales';
import rootStore from '../../store/RootStore';
import JobProxy from '../../../../libs/JobProxy';
import './index.scss';

interface QualityControlProps {
  readonly: boolean;
  review?: Review;
  jobProxy: JobProxy;
  selectedShapeStatus: ShapeInfo;
  getShapeLabel: (instanceId: string, category: string, groupName: string) => string;
}

const radioOptions = [
  ReviewResult.APPROVE,
  ReviewResult.REJECT,
  ReviewResult.SUSPEND
];

const formItemLayoutVertical = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 24 },
  },
};

const QualityControl = ({
  readonly,
  review,
  jobProxy,
  selectedShapeStatus,
  getShapeLabel
}: QualityControlProps) => {
  const [form] = Form.useForm();
  const [previewImg, setPreviewImg] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [currentValues, setCurrentValues] = useState<ReviewData | null>(null);

  useEffect(() => {
    if (review && selectedShapeStatus) {
      const { instanceId, category, groupName } = selectedShapeStatus;
      const groupTitle = getShapeLabel(instanceId, category, groupName);
      setLabel(`${groupTitle}-${review.shapeIds.length > 1 ? `[${review.shapeIds.join(',')}]` : review.shapeIds[0]}`);
    }
  }, []);

  useEffect(() => {
    if (review) {
      setCurrentValues({
        result: review.result,
        type: review.type,
        comment: review.comment,
      });
      if (form) {
        form.setFieldsValue({ result: review.result });
      }
    } else {
      setCurrentValues(null);
    }
  }, [review]);

  const handleValues = async () => {
    if (rootStore.review.isEnabled && !rootStore.review.drawMode) {
      const results = await form.validateFields();
      if (!results.errorFields) {
        rootStore.review.setReview(results);
        message.success(formatMessage(`QC_SET_${results.result.toLocaleUpperCase()}`));
      }
    } else {
      rootStore.review.setSelectedReview();
    }
  };

  /**
  * save file
  * @param file
  */
  const saveFile = (file: File) => jobProxy.saveFile(file);

  return (
    <>
      <Modal
        visible={!!review}
        draggable
        closable={false}
        dragId="keypoint-qa-form"
        maskClosable
        title={formatMessage('QC_MODAL_TITLE')}
        onClose={handleValues}
      >
        <div className="qa-form">
          <p>{label}</p>
          {!readonly ? (
            <Form
              form={form}
              size="small"
              layout="vertical"
              initialValues={{
                result: review?.result,
                type: review?.type,
                comment: review?.comment
              }}
            >
              <Form.Item name="result">
                <Radio.Group style={{ width: '100%' }}>
                  <Row>
                    {radioOptions.map((type, i) => (
                      <Col key={type} span={8}>
                        <Radio.Button value={type} className={type}>
                          <span>{formatMessage(`QC_${type.toUpperCase()}`)}</span>
                          <span className="hint">{i + 1}</span>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                className="clearStyle"
                noStyle
                shouldUpdate={(prevValues, curValues) => prevValues.result !== curValues.result}
                {...formItemLayoutVertical}
              >
                {({ getFieldValue }) => {
                  if (getFieldValue('result') === ReviewResult.REJECT) {
                    return (
                      <>
                        <Form.Item
                          name="type"
                          label={formatMessage('QC_REASON_LABEL')}
                          rules={[{ required: true, message: formatMessage('QC_REASON_LABEL') }]}
                        >
                          <Select
                            mode="multiple"
                            showArrow
                            style={{ width: '100%' }}
                            dropdownClassName="keypoint-qc-selected"
                          >
                            {rootStore.review.issueTypes.map((item) => (
                              <Select.Option value={item} key={item}>{item}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item name="comment">
                          <ImageTextField uploader={saveFile} />
                        </Form.Item>
                      </>
                    );
                  }
                }}
              </Form.Item>
              <Button onClick={() => { rootStore.review.deleteReviewByInstance(); }}>{formatMessage('QC_DELETE')}</Button>
              <Button style={{ marginLeft: '10px' }} onClick={handleValues}>{formatMessage('QC_SAVE')}</Button>
            </Form>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {currentValues?.result && formatMessage(`QC_${currentValues.result.toUpperCase()}`)}
              </div>
              <div style={{ marginTop: 16 }}>
                <div>{formatMessage('QC_NO_REASON')}</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{currentValues?.type?.join(', ')}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div>{formatMessage('QC_COMMENT_LABEL')}</div>
                <div
                  style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  className="img-container"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === 'IMG') {
                      setPreviewImg((e.target as HTMLImageElement).src);
                    }
                  }}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: currentValues?.comment || '' }}
                />
              </div>
            </>
          )}
        </div>
      </Modal>
      {previewImg && <ImagePreview src={previewImg} maskClosable onClose={() => setPreviewImg('')} />}
    </>
  );
};

export default observer(QualityControl);
