import axios from "axios";

const server = axios.create({
  baseURL: "http://localhost:3042",
});

// Add request interceptor to log all requests
server.interceptors.request.use(
  (config) => {
    console.log("Axios request:", config.method?.toUpperCase(), config.url);
    console.log("Full request URL:", config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error("Axios request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to log all responses
server.interceptors.response.use(
  (response) => {
    console.log("Axios response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("Axios response error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default server;
