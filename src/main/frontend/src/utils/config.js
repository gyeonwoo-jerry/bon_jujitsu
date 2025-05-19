// src/config/index.js
const dev = {
  apiUrl: "http://211.110.44.79:58080",
  addrKey : "U01TX0FVVEgyMDIzMTEyNzIwMTIyNTExNDMwOTM="
};

const prod = {
  apiUrl: "http://localhost:8080",
  addrKey : "U01TX0FVVEgyMDIzMTEyNzIwMTIyNTExNDMwOTM="
};

const local = {
  apiUrl: "http://211.110.44.79:58080",
  addrKey : "U01TX0FVVEgyMDIzMTEyNzIwMTIyNTExNDMwOTM="
};

const config =
  process.env.REACT_APP_SPRING_PROFILE === "prod"
    ? prod
    : process.env.REACT_APP_SPRING_PROFILE === "dev"
    ? dev
    : local;

export default config;
