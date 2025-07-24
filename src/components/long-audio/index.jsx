import React from 'react';
import { Provider } from 'react-redux';
import VideoAnnotationApp from './components/VideoAnnotationApp';
import reduxStore from './redux/store';
import i18n from './locales';

class VideoAnnotationWrapper extends React.Component {
  constructor(props) {
    super(props);
    i18n.setLocale(props.locale);
    this.appRef = React.createRef();
  }

  exportResult() {
    return this.appRef.current.saveResult(true);
  }

  getReviews() {
    return this.appRef.current.saveReviews(true);
  }

  submitReviews() {
    return this.appRef.current.saveReviews(true);
  }

  render() {
    return (
      <Provider store={reduxStore}>
        <VideoAnnotationApp
          ref={this.appRef}
          payload={this.props}
          renderComplete={this.props.renderComplete}
          jobProxy={this.props.jobProxy}
        />
      </Provider>
    );
  }
}

export default VideoAnnotationWrapper;
