const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const apiUrl = "http://bon-dev.ezylab.co.kr/"; // 기본 포트 설정

  app.use(
    "/api",
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
    })
  );
};
