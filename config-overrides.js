const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const paths = require('react-scripts/config/paths');
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

paths.appIndexJs = resolveApp('src/tools/index.tsx');

const replacePlugins = (plugins, nameMatcher, newPlugins) => {
  return plugins
    .filter(plugin => !(plugin.constructor && plugin.constructor.name && nameMatcher(plugin.constructor.name)))
    .concat(newPlugins);
};

const getTools = () => {
  const toolsDir = resolveApp('src/tools/');
  return fs.readdirSync(toolsDir).map(file => file.split('.').shift());
};

module.exports = {
  webpack: function override(config, env) {
    const isDev = env !== 'production';
    const publicPath = isDev ? '/' : paths.servedPath;
    const tools = getTools();

    // disable eslint
    config.module.rules = config.module.rules.filter((rule) => !(rule.use && rule.use[0] && /eslint-loader/.test(rule.use[0].loader)));
    // support web worker
    config.module.rules.unshift({
      test: /\.worker\.(j|t)s$/,
      use: { loader: 'worker-loader' },
    });

    // entry
    config.entry = tools.reduce((acc, curr) => {
      acc[curr] = [
        isDev && require.resolve('react-dev-utils/webpackHotDevClient'),
        resolveApp(`src/tools/${curr}.tsx`),
      ].filter(Boolean);
      return acc;
    }, {});

    if (!isDev) {
      config.devtool = 'none'
    }

    // output
    config.output = {
      path: paths.appBuild,
      publicPath,
      filename: 'static/js/[name].[hash].bundle.js',
      chunkFilename: 'static/js/[name].[chunkhash].chunk.js',
      hashDigestLength: 8,
      devtoolModuleFilenameTemplate: info => path.resolve(info.absoluteResourcePath),
    };

    // HtmlWebpackPlugin
    const htmlPlugins = tools.map(tool => new HtmlWebpackPlugin({
      filename: `${tool}.html`,
      inject: true,
      template: paths.appHtml,
      chunks: [tool],
      minify: !isDev,
    }));
    config.plugins = replacePlugins(config.plugins, (name) => /HtmlWebpackPlugin/i.test(name), htmlPlugins);

    // ManifestPlugin
    const multiEntryManfiestPlugin = new ManifestPlugin({
      fileName: 'manifest.json',
      publicPath,
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);

        const entrypointFiles = {};
        Object.keys(entrypoints).forEach(entrypoint => {
          entrypointFiles[entrypoint] = entrypoints[entrypoint].filter(fileName => !fileName.endsWith('.map'));
        });

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    });
    config.plugins = replacePlugins(config.plugins, (name) => /ManifestPlugin/i.test(name), multiEntryManfiestPlugin);

    return config;
  },
};
