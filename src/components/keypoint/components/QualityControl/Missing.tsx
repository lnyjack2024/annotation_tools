import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Form, message } from 'antd';
import { ImageTextField } from '@appen-china/easy-form';
import Modal from '../../../common/modal/Modal';
import ImagePreview from '../../../common/modal/ImagePreview';
import formatMessage from '../../locales';
import rootStore from '../../store/RootStore';
import JobProxy from '../../../../libs/JobProxy';
import './index.scss';

interface QualityControlProps {
  readonly: boolean;
  jobProxy: JobProxy;
}

const QualityControl = ({
  readonly,
  jobProxy,
}: QualityControlProps) => {
  const [form] = Form.useForm();
  const [previewImg, setPreviewImg] = useState<string>('');
  const { selectedMissingReview, selectedMissingReviewModalVisible } = rootStore.review;

  useEffect(() => {
    form.resetFields();
  }, [selectedMissingReview]);

  const handleValues = async () => {
    if (rootStore.review.isEnabled && !rootStore.review.drawMode) {
      const results = await form.validateFields();
      if (!results.errorFields) {
        rootStore.review.updateMissingReview({
          ...selectedMissingReview,
          ...results,
        });
        message.success(formatMessage('QC_SET_REJECT'));
      }
    }
    rootStore.review.closeMissingReviewModal();
  };

  /**
  * save file
  * @param file
  */
  const saveFile = (file: File) => jobProxy.saveFile(file);

  if (!selectedMissingReview) {
    return null;
  }

  return (
    <>
      <Modal
        visible={selectedMissingReviewModalVisible}
        draggable
        closable={false}
        dragId="keypoint-qa-form"
        maskClosable
        title={formatMessage('QC_MODAL_TITLE')}
        onClose={handleValues}
      >
        <div className="qa-form">
          <p>{`${formatMessage('VALIDATION_FRAME', { values: { frameIndex: selectedMissingReview.frameIndex + 1 } })}Missing${selectedMissingReview.number}-Dot`}</p>
          {!readonly ? (
            <Form
              form={form}
              size="small"
              layout="vertical"
              initialValues={{
                comment: selectedMissingReview.comment
              }}
            >
              <Form.Item name="comment">
                <ImageTextField uploader={saveFile} />
              </Form.Item>
              <Button
                onClick={() => {
                  rootStore.review.deleteMissingReview(selectedMissingReview);
                }}
              >
                {formatMessage('QC_DELETE')}
              </Button>
              <Button
                style={{ marginLeft: '10px' }}
                onClick={handleValues}
              >
                {formatMessage('QC_SAVE')}
              </Button>
            </Form>
          ) : (
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
                dangerouslySetInnerHTML={{ __html: selectedMissingReview.comment || '' }}
              />
            </div>
          )}
        </div>

      </Modal>
      {previewImg && <ImagePreview src={previewImg} maskClosable onClose={() => setPreviewImg('')} />}
    </>
  );
};

export default observer(QualityControl);
