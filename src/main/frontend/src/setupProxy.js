import config from "./utils/config";
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const apiUrl = config.apiUrl; // 기본 포트 설정

  app.use(
    "/api",
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
    })
  );
};
