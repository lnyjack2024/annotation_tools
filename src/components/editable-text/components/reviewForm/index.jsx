/* eslint-disable no-nested-ternary */
import React, { forwardRef, useEffect, useState, useRef, useCallback } from 'react';
import { Form, Button, Select, Input, Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import classnames from 'classnames';
import localMessage from '../../locale';
import { isReviewEditable } from '../../../../utils/tool-mode';
import { isQATag } from '../../store/tag_mode';
import store from '../../store/RootStore';
import { ReviewMode } from '../../types';

const ReviewForm = forwardRef((props) => {
  const {
    toolMode,
    tagReviewInfo,
    issueTypes,
    tagOpenReview,
    setFormVisible,
    onConfirm,
    onDelete,
  } = props;

  const reviewFormRef = useRef(null);
  const [comment, setCommit] = useState('');
  const [type, setType] = useState([]);
  const [result, setResult] = useState('reject');
  const [typeError, setTypeError] = useState(false);

  useEffect(() => {
    setTypeError(false);
    setResult(tagReviewInfo?.result || '');
    setType(tagReviewInfo?.type || []);
    setCommit(tagReviewInfo?.comment || '');
  }, [tagOpenReview, tagReviewInfo]);

  const mousedown = useCallback((e) => {
    /* clicked element is contained  */
    if (!reviewFormRef.current?.contains(e.target)) {
      setFormVisible(false);
    }
  }, []);

  useEffect(() => {
    if (tagOpenReview) {
      document.addEventListener('mousedown', mousedown);
    } else {
      document.removeEventListener('mousedown', mousedown);
    }
  }, [tagOpenReview]);

  if (!tagOpenReview) {
    return null;
  }
  function confirm() {
    if (result === 'reject' && (!type || type.length <= 0)) {
      setTypeError(true);
      return;
    }
    if (!isQATag(tagOpenReview.type)) {
      if (result === 'pass') {
        onConfirm({
          result,
        });
      } else {
        onConfirm({
          result,
          type,
          comment,
        });
      }
    } else {
      onConfirm({
        result: 'missing',
        comment,
      });
    }
    setFormVisible(false);
  }

  function remove() {
    onDelete();
    setFormVisible(false);
  }

  const renderResult = () => {
    if (isReviewEditable(toolMode) && store.config.reviewMode === ReviewMode.REVIEW) {
      return (
        <div className="review-result">
          <div
            key="pass"
            className={classnames('review-btn', {
              pass: true,
              active: result === 'pass',
            })}
            onClick={() => setResult('pass')}
          >
            {localMessage('pass')}
          </div>
          <div
            key="reject"
            className={classnames('review-btn', {
              reject: true,
              active: result === 'reject',
            })}
            onClick={() => setResult('reject')}
          >
            {localMessage('reject')}
          </div>
        </div>
      );
    }
    return (
      <div className="review-result">
        <Tag
          icon={result === '' ? <ClockCircleOutlined /> : result === 'reject' ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
          color={result === '' ? 'default' : result === 'reject' ? 'error' : 'success'}
        >
          {
          result === '' ? localMessage('not-reviewed') : result === 'reject' ? localMessage('reject') : localMessage('pass')
        }
        </Tag>
      </div>
    );
  };
  const renderReason = () => {
    if (isReviewEditable(toolMode) && store.config.reviewMode === ReviewMode.REVIEW) {
      return (
        <Form.Item
          required={result === 'reject'}
          labelCol={{ span: 24 }}
          label={localMessage('REVIEW_REASON_LABEL')}
          validateStatus={typeError ? 'error' : ''}
        >
          <Select
            mode="multiple"
            size="small"
            value={type}
            disabled={!isReviewEditable(toolMode) || store.config.reviewMode !== ReviewMode.REVIEW}
            onChange={(v) => setType(v)}
            getPopupContainer={(node) => {
              if (node) {
                return node.parentNode;
              }
              return document.body;
            }}
          >
            {issueTypes?.split(',').map((item) => (
              <Select.Option value={item} key={item}>{item}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    }
    return (
      <div className="review_content_readonly">
        <div className="title">{localMessage('REVIEW_REASON')}</div>
        <div className="content">{type?.join(',')}</div>
      </div>
    );
  };
  const renderComment = () => {
    if (isReviewEditable(toolMode) && store.config.reviewMode === ReviewMode.REVIEW) {
      return (
        <Input.TextArea
          placeholder={localMessage('comment')}
          value={comment}
          onChange={(e) => setCommit(e.target.value)}
          onFocus={() => { window.disableTextHotKeys = true; }}
          onBlur={() => { window.disableTextHotKeys = false; }}
          disabled={!isReviewEditable(toolMode) || store.config.reviewMode !== ReviewMode.REVIEW}
        />
      );
    }
    return (
      <div className="review_content_readonly">
        <div className="title">{localMessage('comment')}</div>
        <div className="content">{comment}</div>
      </div>
    );
  };
  return (
    <div
      className={classnames('review-wrapper', {
        'review-wrapper-display': tagOpenReview != null,
      })}
    >
      <div
        className="review-form"
        ref={reviewFormRef}
      >
        <div className="review-form-title">
          {localMessage('REVIEW_MODAL_LABEL')}
        </div>
        <div className="review-form-content">
          <div className="review-info">{tagOpenReview.value}</div>

          {
          !isQATag(tagOpenReview.type)
            ? (
              <>
                {renderResult() }
                {
                  result === 'reject' && (
                  <>
                    {renderReason()}
                    {renderComment()}
                  </>
                  )
                }
              </>
            )
            : <>{renderComment()}</>
        }
        </div>
        {isReviewEditable(toolMode) && store.config.reviewMode === ReviewMode.REVIEW && (
        <div className="review-form-footer">
          <Button className="review-form-btn" onClick={(e) => remove()}>{localMessage('delete')}</Button>
          <Button className="review-form-btn" onClick={(e) => confirm()} type="primary">{localMessage('confirm')}</Button>
        </div>
        )}
      </div>
    </div>
  );
});

export default ReviewForm;
