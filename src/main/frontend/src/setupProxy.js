const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const apiUrl = "http://211.110.44.79:58080"; // 기본 포트 설정

  app.use(
    "/api",
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
    })
  );
};
