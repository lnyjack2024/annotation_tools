import React from 'react';
import { observer } from 'mobx-react';
import { getReviewRelatedInstanceInfo } from './ReviewModal';
import store from '../../store/RootStore';
import i18n from '../../locales';
import './ReviewComment.scss';
import { ReviewResult } from '../../types';

const commentWidth = 348;

const ReviewComment = observer(() => {
  const { reviewLayerOffset, hoveredReview, hoveredAnchor } = store.review;

  if (!hoveredReview || !hoveredAnchor) {
    return null;
  }

  const { x, y } = hoveredAnchor.container.toGlobal({ x: hoveredReview.x, y: hoveredReview.y });
  const left = x + reviewLayerOffset.x;
  const top = y + reviewLayerOffset.y;
  let cLeft = left + 32;
  if (cLeft + commentWidth > document.body.clientWidth) {
    cLeft = left - commentWidth - 32;
  }
  const cTop = top - 32;
  return (
    <div className="review-comment" style={{ width: commentWidth, left: cLeft, top: cTop }}>
      <div className="review-comment-title">
        {hoveredReview.result === ReviewResult.APPROVE && i18n.translate('REVIEW_APPROVE_TITLE')}
        {hoveredReview.result === ReviewResult.REJECT && i18n.translate('REVIEW_REJECT_TITLE')}
        {hoveredReview.result === ReviewResult.SUSPEND && i18n.translate('REVIEW_SUSPEND_TITLE')}
      </div>
      <div className="review-comment-content">
        {`[${getReviewRelatedInstanceInfo(hoveredReview).infoStr}] `}
        {`[${i18n.translate('FRAME_ATTRIBUTES_FRAME', { values: { frame: store.frame.currentFrame + 1 } })}]`}
        {hoveredReview.type?.join(';')}
        <div
          className="img-container"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: hoveredReview.comment || '' }}
        />
      </div>
    </div>
  );
});

export default ReviewComment;
