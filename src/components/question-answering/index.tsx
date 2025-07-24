import React from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { Modal, message } from 'antd';
import AutoSaver from '../common/AutoSaver';
import LayoutWrapper from '../common/layout/LayoutWrapper';
import Layout, { InputArea, MainContent, SidePanel } from '../common/llm/layout/Layout';
import SubjectSelector from '../common/llm/subject/SubjectSelector';
import InputWrapper from '../common/llm/input/InputWrapper';
import Sidebar, { AttributePanel } from '../common/llm/layout/sidebar';
import ValidationPanel from './components/validationPanel';
import Content from './components/Content';
import AttributesConfig, { AttributesConfigHandle } from '../common/llm/attributes-config/AttributesConfig';
import store from './store';
import i18n from './locales';
import { Payload } from './types';
import './index.scss';
import LocaleContext from '../common/llm/locales/context';

interface AppProps extends Payload {
  renderComplete: () => Promise<void>;
}

class App extends React.Component<AppProps> {
  saverRef = React.createRef<AutoSaver>();

  attributesConfigRef = React.createRef<AttributesConfigHandle>();

  constructor(props: AppProps) {
    super(props);

    // setup i18n
    i18n.setLocale(this.props.locale);
    // set props
    store.jobProxy = this.props.jobProxy;
  }

  async componentDidMount() {
    // init tool
    await store.init(this.props);

    // render completed
    this.props.renderComplete();

    // check temp saved data
    // if (this.props.jobProxy.savedDataLoadError) {
    //   Modal.confirm({
    //     title: i18n.translate('TEMP_SAVED_LOAD_ERROR'),
    //     okText: i18n.translate('TEMP_SAVED_LOAD_ERROR_OK'),
    //     cancelText: i18n.translate('TEMP_SAVED_LOAD_ERROR_CANCEL'),
    //     autoFocusButton: null,
    //     onOk: () => {
    //       // set temp saved to true to disable leave check
    //       this.saverRef.current?.setTempSaved(true);
    //       window.location.reload();
    //     },
    //     onCancel: () => {
    //       // set to false to enable result save
    //       this.props.jobProxy.savedDataLoadError = false;
    //     },
    //   });
    // }
  }

  saveResult = async () => {
    this.saverRef.current?.disableLeaveCheck();
    if (this.attributesConfigRef?.current && !this.attributesConfigRef.current.validateForm()) {
      throw new Error(i18n.translate('GLOBAL_ATTR_EMPTY_ERROR'));
    };
    if (store.submitCheck) {
      // validate before submit
      await store.validation!.defaultSync();
      if (store.validation!.blocked) {
        throw new Error(i18n.translate('SUBMIT_CHECK_FAIL'));
      }
    }
    return store.saveResult(true);
  };

  saveReviews = () => {
    this.saverRef.current?.disableLeaveCheck();
    return store.saveReviews(true);
  };

  save = async (isAutoSave = false) => {
    if (!store.initialized || store.isPreview) {
      return;
    }

    const promises = [];
    if (store.annotatable) {
      promises.push(store.saveResult());
    }
    if (store.reviewable) {
      promises.push(store.saveReviews());
    }
    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        message.success(i18n.translate(isAutoSave ? 'SAVE_AUTO_SUCCESS' : 'SAVE_SUCCESS'));
        // update tempSaved flag
        this.saverRef.current?.setTempSaved(true);
      } catch (e) {
        if (!isAutoSave) {
          message.error(i18n.translate('SAVE_FAIL'));
        } else {
          throw e;
        }
      }
    }
  };

  render() {
    return (
      <LayoutWrapper
        className="question-answering-app"
        loading={!store.initialized}
        onMouseDown={store.validateItem}
      >
        <AutoSaver
          ref={this.saverRef}
          leaveCheck
          data={{
            subject: store.subject,
            answers: toJS(store.answers),
          }}
          save={() => this.save(true)}
        />
        <LocaleContext.Provider value={i18n.locale}>
          <Layout
            saveProps={{
              disabled: store?.isPreview || !store?.initialized,
              onSave: this.save,
              title: i18n.translate('TOOLBAR_TIP_SAVE'),
            }}
          >
            <MainContent>
              <Content />
            </MainContent>
            <SidePanel>
              <Sidebar warningCount={store.validation?.warningCount} panelNames={[i18n.translate('SIDEBAR_ATTRIBUTE_LABEL'), i18n.translate('SIDEBAR_VALIDATION_LABEL')]}>
                <AttributePanel>
                  <SubjectSelector
                    disabled={store.readonly}
                    options={store.subjectOptions}
                    value={store.subject}
                    onChange={store.setSubject}
                  />
                  <AttributesConfig
                    ref={this.attributesConfigRef}
                    disabled={store.readonly}
                    config={store.attributesConfig}
                    value={toJS(store.attributes)}
                    onChange={store.setAttributesConfig}
                  />
                </AttributePanel>
                <ValidationPanel />
              </Sidebar>
            </SidePanel>
            {(store.isAddingAnswer || store.isEditingAnswer) && (
              <InputArea>
                <InputWrapper
                  types={store.editorTypes}
                  defaultValue={store.selectedAnswer?.value}
                  onSubmit={store.saveAnswer}
                  onCancel={store.cancelSaveAnswer}
                  onError={store.catchSaveError}
                />
              </InputArea>
            )}
          </Layout>
        </LocaleContext.Provider>
      </LayoutWrapper>
    );
  }
}

export default observer(App);
