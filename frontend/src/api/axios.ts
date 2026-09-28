import axios from "axios";
import { setupInterceptors } from "./interceptor";

export const api = setupInterceptors(
  axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
      "Content-Type": "application/json",
    },
  })
);

export default api;