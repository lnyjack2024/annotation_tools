/*
 * @Description: 
 * @Author: wangyonghong
 * @Date: 2025-07-09 10:29:54
 * @LastEditTime: 2025-07-16 14:12:01
 */
export default {
  "/api/": {
    target: "http://localhost:3000/", // requests to mashup
    changeOrigin: true,
    cookieDomainRewrite: {
      "*": "",
    },
  },
  "/ssr/": {
    target: "http://localhost:3000/", // requests to mashup
    changeOrigin: true,
  },
  "/public/": {
    target: "http://localhost:3000/", // requests to mashup
    changeOrigin: true,
  },
  "/api-gw/": {
    // target: "http://192.168.208.72:8080/", // requests to api gateway
    target: "http://localhost:8080", // requests to api gateway
    changeOrigin: true,
    secure: false,
    cookieDomainRewrite: {
      "*": "",
    },
    pathRewrite: { '/api-gw': '' },
  },
  "/pointcloud-api/": {
    target: "http://example.com/",
    changeOrigin: true,
  },
};
