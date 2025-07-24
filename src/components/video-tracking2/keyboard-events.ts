import Mousetrap from 'mousetrap';
import { VideoTracking } from './index';
import store from './store/RootStore';
import { ReviewMode } from './types';
import { ToolMode } from '../../utils/tool-mode';

Mousetrap.addKeycodes({
  188: 'comma',
  190: 'period',
  191: 'slash',
});

export default function bindKeyboardEvents(ctx: VideoTracking) {
  // default keyboard events
  Mousetrap.bind('comma', () => {
    if (!store.config.isAnyModalOpened) {
      store.frame.prev(1);
    }
    return false;
  });
  Mousetrap.bind('period', () => {
    if (!store.config.isAnyModalOpened) {
      store.frame.next(1);
    }
    return false;
  });
  Mousetrap.bind('shift+comma', () => {
    if (!store.config.isAnyModalOpened) {
      store.frame.prev(10);
    }
    return false;
  });
  Mousetrap.bind('shift+period', () => {
    if (!store.config.isAnyModalOpened) {
      store.frame.next(10);
    }
    return false;
  });
  Mousetrap.bind('slash', () => {
    if (!store.config.isAnyModalOpened) {
      store.frame.togglePlaying();
    }
    return false;
  });
  Mousetrap.bind('space', () => {
    if (!store.frame.loading) {
      store.toggleAddMode();
    }
    return false;
  });
  Mousetrap.bind('tab', () => {
    if (!store.frame.loading && !store.config.isAnyModalOpened) {
      store.instance.selectInstance(null);
    }
    return false;
  });
  Mousetrap.bind(['del', 'backspace'], () => {
    store.delete();
    return false;
  });
  Mousetrap.bind(['ctrl+s', 'command+s'], () => {
    ctx.save();
    return false;
  });
  Mousetrap.bind(['ctrl+z', 'command+z'], () => {
    store.undo.undo();
    return false;
  });
  Mousetrap.bind(['ctrl+y', 'command+y'], () => {
    store.undo.redo();
    return false;
  });
  Mousetrap.bind('shift+c', () => {
    if (store.jobProxy?.toolMode === ToolMode.QA_RW) {
      store.config.setReviewMode(store.config.reviewMode === ReviewMode.LABELING ? ReviewMode.REVIEW : ReviewMode.LABELING);
    }
    return false;
  });
  Mousetrap.bind('shift+l', () => {
    store.config.setCrossLineVisible(!store.config.crossLineVisible);
    return false;
  });
  Mousetrap.bind('o', () => {
    store.openAttributesModal();
    return false;
  });
  Mousetrap.bind(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], (e) => {
    const num = Number(e.key);
    if (!Number.isNaN(num)) {
      store.activateTool(num);
    }
    return false;
  });
  Mousetrap.bind('s', () => {
    store.shape.subtractPolygon();
    return false;
  });
  Mousetrap.bind('m', () => {
    store.shape.merge();
    return false;
  });
  Mousetrap.bind('up', () => {
    store.moveFront();
    return false;
  });
  Mousetrap.bind('shift+up', () => {
    store.moveFront(true);
    return false;
  });
  Mousetrap.bind('down', () => {
    store.moveBack();
    return false;
  });
  Mousetrap.bind('shift+down', () => {
    store.moveBack(true);
    return false;
  });
  Mousetrap.bind('t', () => {
    store.shape.updateConfig({ fill: !store.shape.config.fill });
    return false;
  });

  return () => {
    Mousetrap.unbind('comma');
    Mousetrap.unbind('period');
    Mousetrap.unbind('shift+comma');
    Mousetrap.unbind('shift+period');
    Mousetrap.unbind('slash');
    Mousetrap.unbind('space');
    Mousetrap.unbind('tab');
    Mousetrap.unbind(['del', 'backspace']);
    Mousetrap.unbind(['ctrl+s', 'command+s']);
    Mousetrap.unbind(['ctrl+z', 'command+z']);
    Mousetrap.unbind(['ctrl+y', 'command+y']);
    Mousetrap.unbind('shift+c');
    Mousetrap.unbind('shift+l');
    Mousetrap.unbind('o');
    Mousetrap.unbind(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    Mousetrap.unbind('s');
    Mousetrap.unbind('m');
    Mousetrap.unbind('up');
    Mousetrap.unbind('shift+up');
    Mousetrap.unbind('down');
    Mousetrap.unbind('shift+down');
    Mousetrap.unbind('t');
  };
}
