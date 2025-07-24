import React from 'react';
import { BitmapFont } from 'pixi.js';
import { Application } from 'pixi.js-legacy';
import Cursor from '../../Cursor';

interface Options {
  mappingMethods?: string[];
}

const AppWrapper = (WrappedComponent: any, options?: Options) => class App extends React.Component {
  /**
   * component ref
   */
  ref = React.createRef<any>();

  /**
   * PIXI application
   */
  app = new Application({
    antialias: true,
    // autoDensity: true,
    resolution: window.devicePixelRatio,
  });

  [param: string]: any;

  componentDidMount() {
    if (options) {
      const { mappingMethods } = options;
      if (mappingMethods) {
        mappingMethods.forEach((methodName: string) => {
          this[methodName] = this.ref.current[methodName];
        });
      }
    }
    window.matchMedia('screen and (min-resolution: 2dppx)').addEventListener('change', this.updateResolution);
    // load default bitmap font
    BitmapFont.from('ALPHA_NUMERIC', {
      fontFamily: 'Arial',
      fontSize: 12,
      lineHeight: 14,
      fill: '#FFFFFF',
      dropShadow: true,
      dropShadowAlpha: 0.8,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    });
  }

  componentWillUnmount() {
    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true,
    });
    window.matchMedia('screen and (min-resolution: 2dppx)').removeEventListener('change', this.updateResolution);
  }

  updateResolution = () => {
    this.app.renderer.resolution = window.devicePixelRatio;
    this.app.renderer.plugins.interaction.resolution = window.devicePixelRatio;
    this.app.renderer.emit('resolution-changed');
  };

  setCursor(cursor: Cursor) {
    this.app.view.style.cursor = cursor;
  }

  render() {
    return (
      <WrappedComponent
        ref={this.ref}
        {...this.props}
        app={this.app}
        setCursor={this.setCursor}
      />
    );
  }
};

export default AppWrapper;
