import React from 'react';
import { observer } from 'mobx-react';
import { Draggable, DroppableProvided } from 'react-beautiful-dnd';
import Answer from './Answer';
import store from '../../store';

interface AnswersListProps {
  droppableProvided: DroppableProvided;
}

const AnswersList: React.FC<AnswersListProps> = observer(({
  droppableProvided,
}) => (
  <div
    {...droppableProvided.droppableProps}
    ref={droppableProvided.innerRef}
  >
    {store.answers.map((answer, index) => (
      <Draggable
        key={answer.id}
        draggableId={answer.id}
        index={index}
        isDragDisabled={store.readonly || !store.sortable}
      >
        {(draggableProvided, draggableSnapshot) => (
          <Answer
            draggableProvided={draggableProvided}
            draggableSnapshot={draggableSnapshot}
            index={index}
            answer={answer}
          />
        )}
      </Draggable>
    ))}
    {droppableProvided.placeholder}
  </div>
));

export default AnswersList;
