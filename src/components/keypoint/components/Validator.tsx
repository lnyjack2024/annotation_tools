import React from 'react';
import { observer } from 'mobx-react';
import CommonValidator, { IWarning } from '../../common/tabs-menu/Validator';
import formatMessage from '../locales';
import JobProxy from '../../../libs/JobProxy';
import rootStore from '../store/RootStore';
import { InstanceAct, ValidationType, Group, ReviewResult, Review } from '../types';
import './Validator.scss';
import Canvas from './Canvas';

interface ValidatorProps {
  canvas: Canvas | null;
  containerWidth?: number | string;
  containerHeight?: number | string;
  instances: {[instanceId: string]: InstanceAct};
  jobProxy: JobProxy;
  warnings: IWarning[];
  setFrame: (frame: number) => void;
  setSelectedShape: (id: number | string, groupData?: Group) => void;
  selectGroup: (id: string, groupName: string) => void;
  getInstance: (instanceID: string) => InstanceAct;
  saveResult: () => Promise<string>;
}

@observer
class Validator extends React.Component<ValidatorProps> {
  getCategoryByWarning(warning: IWarning) {
    const { id, groupName, shapeIds, frames } = warning;
    const instance = this.props.getInstance(id);
    const ontologyItem = rootStore.ontology.getOntologyInfo(instance?.category);
    const groupItem = ontologyItem && ontologyItem.children && ontologyItem.children.find((group) => group.name === groupName);
    return ontologyItem && instance ?
      `${formatMessage('VALIDATION_FRAME', {
        values: { frameIndex: frames[0] + 1 }
      })}
      ${ontologyItem.display_name || ontologyItem.class_name || ''} ${instance.number}
      ${groupItem ? `- ${groupItem.display_name || groupItem.name}` : ''}
      ${shapeIds && shapeIds.length && (typeof shapeIds[0] === 'number') ? `[${shapeIds.join(',')}]` : ''}` :
      '';
  }

  handleAction = (warning: IWarning) => {
    const { setFrame, setSelectedShape, selectGroup } = this.props;
    const { id, groupName, shapeIds, data, frames } = warning;
    setFrame(frames[0]);
    if (data?.position) {
      const missingReview = rootStore.review.missingReviews.find((r) => r.id === id);
      if (missingReview) {
        rootStore.review.setSelectedMissingReview(missingReview);
      }
      this.props.canvas?.fitPoint(data.position);
      return;
    }
    const instance = this.props.getInstance(id);
    if (groupName) {
      if (shapeIds && shapeIds.length) {
        setSelectedShape(shapeIds[0], {
          instanceId: id,
          category: instance?.category,
          groupName
        });
      } else {
        selectGroup(id, groupName);
      }
      this.props.canvas?.fitSelected(id);
    }
  };

  renderWarningTitle(warning: IWarning) {
    const { id } = warning;
    const category = this.getCategoryByWarning(warning);
    if (!category) {
      return formatMessage('VALIDATION_NO_INSTANCE');
    }
    const instance = this.props.getInstance(id);
    return (
      <>
        <div
          className="cat-color-dot"
          style={{ backgroundColor: rootStore.ontology.getOntologyInfo(instance.category)?.display_color }}
        />
        {category}
      </>
    );
  }

  warningMoreHandleAction = (key: string, warning: IWarning) => {
    if (key === ReviewResult.REJECT) return;
    const { frames, id, groupName, shapeIds } = warning;
    const currentReview: Review = {
      instanceId: id,
      groupName: groupName as string,
      frameIndex: frames[0],
      shapeIds: shapeIds!,
      result: ReviewResult.REJECT
    };
    if (key === 'delete') {
      rootStore.review.deleteReviewByInstance(currentReview);
    } else {
      rootStore.review.setReview(
        { result: key as ReviewResult },
        currentReview
      );
    }
  };

  render() {
    const ValidationTypeTitle = {
      [ValidationType.QUALITY]: formatMessage('VALIDATION_TYPE_QUALITY'),
    };
    return (
      <CommonValidator
        isEnabled={rootStore.review.isEnabled}
        validationTypes={ValidationTypeTitle}
        warnings={this.props.warnings}
        errors={rootStore.review.errors}
        containerWidth="286px"
        titleFormatter={(count) => formatMessage('VALIDATION_TITLE', { values: { count } })}
        checkingMsgFormatter={() => formatMessage('VALIDATION_CHECKING')}
        renderWarningTitle={(warning) => this.renderWarningTitle(warning as IWarning)}
        showWarningAction={(warning) => !!this.getCategoryByWarning(warning)}
        onWarningAction={(warning) => this.handleAction(warning as IWarning)}
        onMoreHandleAction={this.warningMoreHandleAction}
        formatMessage={formatMessage}
      />
    );
  }
}

export default Validator;
