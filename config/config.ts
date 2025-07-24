import { defineConfig } from "@umijs/max";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

import defaultSettings, { primaryColor } from "./defaultSettings";
import proxy from "./proxy.config";
import routes from "./routes.config";

import { convertLegacyToken } from "@ant-design/compatible/lib";
import { theme } from "antd/lib";

const { defaultAlgorithm, defaultSeed } = theme;

const mapToken = defaultAlgorithm(defaultSeed);
const v4Token = convertLegacyToken(mapToken);
export default defineConfig({
  antd: {
    theme: {},
  },
  dva: {
    immer: {},
  },
  access: {},
  deadCode: {},
  model: {},
  initialState: {
    // loading: '@/components/PageLoading/index',
  },
  request: {},
  hash: true,
  // lowImport: {},
  layout: {
    locale: true,
    siderWidth: 224,
    ...defaultSettings,
  },
  lessLoader: {
    javascriptEnabled: true,
    modifyVars: {
      "root-entry-name": "default",
      ...v4Token,
      "primary-color": primaryColor,
      "border-color-base": "#e5e7ed",
    },
  },
  favicons: ["/favicon.png"],
  locale: {
    default: "zh-CN",
    baseNavigator: true,
  },
  history: {
    type: "hash",
  },
  manifest: {
    basePath: "/",
  },
  routes,
  proxy,
  // dynamicImport: false,
  // nodeModulesTransform: {
  //   type: 'none',
  // },
  chainWebpack(config) {
    config.plugin("monaco-editor").use(MonacoWebpackPlugin, [
      {
        languages: ["typescript", "javascript", "css", "html"],
      },
    ]);
  },
  mfsu: {},
  esbuildMinifyIIFE: true,
  // webpack5: {},
  // fastRefresh: true,
});
