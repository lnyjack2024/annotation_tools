/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { connectToParent } from 'penpal';
import { useActivityDispatcher } from 'use-activity-dispatcher';
import { checkRunningMode } from '../utils';
import { AnnotationType, RunningMode, SubmitChannel, SubmitChannelPayload } from '../types';
import { ToolMode, isLabel, isQA } from '../utils/tool-mode';
import JobProxy from '../libs/JobProxy';

interface ConnectProps {
  type: AnnotationType; // annotation tool type
  methods?: { // methods connected to the iframe and tool function names map
    [name: string]: string;
  },
  samplePayload: any; // sample payload to render each tool when not running in an iframe
};

interface Payload {
  locale?: string;
  tool_mode?: string;
  mode?: string; // some tool, it pass tool_mode, others mode
  project_id?: string;
  flow_id?: string;
  job_id?: string;
  task_id?: string;
  record_id?: string;
  _reviews?: string;
  review_from?: any;
  flowData?: any;
}

const isCallableFunc = (func: unknown) => func && (
  {}.toString.call(func) === '[object Function]' ||
  {}.toString.call(func) === '[object AsyncFunction]'
);

const withConnect = ({ type, methods = {}, samplePayload }: ConnectProps) => (WrappedComponent: any) => () => {
  useActivityDispatcher();
  const tool = useRef<any>();
  const mode = checkRunningMode();
  const [payload, setPayload] = useState<Payload | null>(null);
  // functions that parent provides
  const saveContent = useRef<any>(() => {});
  const loadContent = useRef<any>(() => {});
  const renderComplete = useRef<any>(() => {});
  const onShortcutsClick = useRef<any>(() => {});
  // job proxy
  const jobProxy = useRef<JobProxy>();

  useEffect(() => {
    if (mode === RunningMode.IFRAME) {
      // set up iframe connection when the app is running in an iframe
      const connection = connectToParent({
        methods: {
          onSubmit: async () => {
            const func = methods.onSubmit || 'onSubmit';
            if (isCallableFunc(tool.current[func])) {
              const values = await tool.current[func]();
              // make sure onSubmit returns a string
              // consume this value in each tool itself or its custom tag in mashup
              return typeof values === 'string' ? values : JSON.stringify(values);
            }
            return '';
          },
          cleanData: () => {
            const func = methods.cleanData || 'cleanData';
            if (isCallableFunc(tool.current[func])) {
              tool.current[func]();
            }
          },
          isModified: () => {
            const func = methods.isModified || 'isModified';
            if (isCallableFunc(tool.current[func])) {
              return tool.current[func]();
            }
            // return null if this method not provided
            return null;
          },
          getStatistics: () => {
            const func = methods.getStatistics || 'getStatistics';
            if (isCallableFunc(tool.current[func])) {
              return tool.current[func]();
            }
            return undefined;
          },
          getReviews: () => {
            // eslint-disable-next-line no-console
            console.log('in get reviews');
            const func = methods.getReviews || 'getReviews';
            if (isCallableFunc(tool.current[func])) {
              return tool.current[func]();
            }
            return undefined;
          },
          submitReviews: () => {
            // eslint-disable-next-line no-console
            console.log('in submit reviews');
            const func = methods.submitReviews || 'submitReviews';
            if (isCallableFunc(tool.current[func])) {
              return tool.current[func]();
            }
            return undefined;
          },
        },
      });

      saveContent.current = (...args: any) => new Promise((resolve, reject) => {
        connection.promise
          .then((parent: any) => parent.saveContent(...args))
          .then((url: string) => {
            resolve(url);
          })
          .catch((e: any) => {
            reject(e);
          });
      });

      loadContent.current = (...args: any) => new Promise((resolve, reject) => {
        connection.promise
          .then((parent: any) => parent.loadContent(...args))
          .then((data: any) => {
            resolve(data);
          })
          .catch((e: any) => {
            reject(e);
          });
      });

      renderComplete.current = () => connection.promise.then((parent: any) => parent.renderComplete());

      // get payload from parent
      connection.promise
        .then((parent: any) => parent.getPayload())
        .then((p: any) => {
          initJobProxy(p);
          setPayload(p);
        });

      onShortcutsClick.current = (...args: any) => connection.promise.then((parent: any) => parent.onShortcutsClick(...args));

      window.addEventListener('keydown', initShortcutsEvent);
    }

    if (mode === RunningMode.STANDALONE) {
      // get sample payload
      initJobProxy(samplePayload);
      setPayload(samplePayload);
    }

    return () => {
      window.removeEventListener('keydown', initShortcutsEvent);
    };
  }, [type, mode]);

  // short
  const initShortcutsEvent = (e: KeyboardEvent) => {
    if (e.shiftKey && e.ctrlKey && jobProxy.current) {
      let name: undefined | SubmitChannel;
      let key: undefined | string;
      const { toolMode } = jobProxy.current;
      if (Object.values(SubmitChannelPayload).indexOf(e.key as any) >= 0) {
        key = e.key;
      }
      if (isLabel(toolMode)) {
        name = SubmitChannel.Label;
      } else if (isQA(toolMode)) {
        name = SubmitChannel.Qa;
      } else if (toolMode === ToolMode.AUDIT) {
        name = SubmitChannel.Audit;
      };

      if (name && key) {
        e.preventDefault();
        onShortcutsClick.current(name, key);
      }
    }
  };

  const initJobProxy = (p: Payload) => {
    jobProxy.current = new JobProxy({
      locale: p.locale,
      toolName: type,
      toolMode: p.tool_mode || p.mode,
      projectId: p.project_id,
      flowId: p.flow_id,
      jobId: p.job_id,
      taskId: p.task_id,
      recordId: p.record_id,
      reviewUrl: p._reviews,
      reviewFrom: p.review_from,
      flowData: p.flowData,
      templateConfig: p,
      saveContent: saveContent.current,
      loadContent: loadContent.current,
    });
  };

  return payload && (
    <WrappedComponent
      ref={tool}
      saveContent={saveContent.current}
      loadContent={loadContent.current}
      renderComplete={renderComplete.current}
      jobProxy={jobProxy.current}
      {...payload}
    />
  );
};

export default withConnect;
