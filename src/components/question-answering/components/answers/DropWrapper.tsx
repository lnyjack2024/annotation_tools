import React from 'react';
import { observer } from 'mobx-react';
import { action } from 'mobx';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import AnswersList from './AnswersList';
import store from '../../store';

const DropWrapper: React.FC = observer(() => (
  <DragDropContext
    onDragStart={action(() => {
      store.isDraggingAnswer = true;
    })}
    onDragEnd={(result) => store.updateAnswerOrder(result.draggableId, result.destination?.index)}
  >
    <Droppable
      droppableId="answers"
      isDropDisabled={store.readonly || !store.sortable}
    >
      {(droppableProvided) => (
        <AnswersList droppableProvided={droppableProvided} />
      )}
    </Droppable>
  </DragDropContext>
));

export default DropWrapper;
