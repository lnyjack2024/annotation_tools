import React from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import cx from 'classnames';
import type { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import ChatItem, { ChatItemType } from '../../../common/llm/chat/ChatItem';
import { Sortable } from '../../../common/icons';
import MAnswer from '../../models/Answer';
import store from '../../store';

interface AnswerProps {
  draggableProvided: DraggableProvided;
  draggableSnapshot: DraggableStateSnapshot;
  index: number;
  answer: MAnswer;
}

const Answer: React.FC<AnswerProps> = observer(({
  draggableProvided,
  draggableSnapshot,
  index,
  answer,
}) => {
  const selected = answer.id === store.selectedAnswer?.id;
  const valueEditable = !store.readonly && (!answer.original || store.editable);
  const rankEditable = !store.readonly && store.ranking;

  return (
    <ChatItem
      dragging={store.isDraggingAnswer}
      draggableProvided={draggableProvided}
      draggableSnapshot={draggableSnapshot}
      type={ChatItemType.A}
      label="A"
      value={toJS(answer.value)}
      onValueChange={(value) => store.updateAnswer(answer, value)}
      originalValue={toJS(answer.originalValue)}
      error={selected && store.hasError}
      selected={selected}
      onSelect={() => store.selectAnswer(answer)}
      valueEditable={valueEditable}
      valueEditing={selected && store.isEditingAnswer}
      onValueEdit={() => store.editAnswer(answer)}
      rankingType={store.rankingType}
      rankingOptions={toJS(store.rankingOptions)}
      rankEditable={rankEditable}
      rankEditing={selected && store.isRankingAnswer}
      onRankEdit={() => store.rankAnswer(answer)}
      rank={toJS(answer.rank)}
      onRankChange={(rank) => store.saveRank(answer, rank)}
      attributesEditable={!store.readonly}
      itemAttributesConfig={store.itemAttributesConfig}
      attributesEditing={selected && store.isItemAttributesEditing}
      attributes={toJS(answer.attributes)}
      onItemAttributesEdit={() => store.onItemAttributesEdit(answer)}
      onItemAttributesChange={(attributes) => store.saveItemAttributes(answer, attributes)}
      onItemAttributesDelete={() => store.deleteItemAttributes(answer)}
      prefix={(
        <div
          {...draggableProvided.dragHandleProps}
          className={cx('chat-item-sorter', {
            sortable: store.sortable,
          })}
        >
          {store.sortable && (
            <div className="chat-item-sorter-handle">
              <Sortable />
            </div>
          )}
          <div>
            {`A ${index + 1}`}
          </div>
        </div>
      )}
    />
  );
});

export default Answer;
