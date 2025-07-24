import React from 'react';
import { isEqual } from 'lodash';
import { checkRunningMode } from '../../utils';
import { RunningMode } from '../../types';

const DEFAULT_INTERVAL = 2 * 60 * 1000; // 2 mins

interface AutoSaverProps {
  interval?: number;
  leaveCheck?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  save: () => void;
  onSaved?: () => void;
}

const beforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  // eslint-disable-next-line no-param-reassign
  event.returnValue = '';
};

export default class AutoSaver extends React.Component<AutoSaverProps> {
  autoSaveTimer: number | undefined;

  tempSaved = true;

  componentDidMount() {
    if (checkRunningMode() === RunningMode.IFRAME) {
      this.autoSaveTimer = window.setInterval(async () => {
        if (!this.tempSaved) {
          try {
            await this.props.save();
            this.setTempSaved(true);
            if (this.props.onSaved) {
              this.props.onSaved();
            }
          } catch (e) {
            // save fail
          }
        }
      }, this.props.interval || DEFAULT_INTERVAL);
    }
  }

  componentDidUpdate(prevProps: AutoSaverProps) {
    if (this.tempSaved && !isEqual(prevProps.data, this.props.data)) {
      // when tempSaved is true and data has been changed, need auto save
      this.setTempSaved(false);
    }
  }

  componentWillUnmount() {
    if (this.autoSaveTimer) {
      window.clearInterval(this.autoSaveTimer);
    }
    this.disableLeaveCheck();
  }

  setTempSaved(tempSaved: boolean) {
    this.tempSaved = tempSaved;
    if (this.props.leaveCheck && checkRunningMode() === RunningMode.IFRAME) {
      if (this.tempSaved) {
        this.disableLeaveCheck();
      } else {
        this.enableLeaveCheck();
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  disableLeaveCheck() {
    window.removeEventListener('beforeunload', beforeUnload);
  }

  // eslint-disable-next-line class-methods-use-this
  enableLeaveCheck() {
    window.addEventListener('beforeunload', beforeUnload);
  }

  render() {
    return null;
  }
}
