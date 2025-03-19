const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8080"; // 기본 포트 설정

  app.use(
    "/api",
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
    })
  );
};
