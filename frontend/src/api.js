// Central API configuration
// In development: proxies to http://localhost:5000
// In production (served by backend): uses same origin (empty string)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default API_BASE;
