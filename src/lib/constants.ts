// FastX Portal Constants
export const APP_NAME = "FastX";
export const APP_TAGLINE = "Unified API Service";

// Default credentials (for demo purposes)
export const DEFAULT_ADMIN_PASSWORD = "stk7890";
export const DEFAULT_USER_KEY = "test7890";

// API Base URL
export const API_BASE_URL = "https://anuapi.netlify.app/.netlify/functions/api";

// Available API endpoints
export const API_ENDPOINTS = [
  {
    id: "mobile",
    name: "Mobile Lookup",
    path: "/mobile",
    param: "number",
    description: "Get details by mobile number",
    placeholder: "Enter mobile number",
  },
  {
    id: "vehicle",
    name: "Vehicle Lookup",
    path: "/vehicle",
    param: "registration",
    description: "Get vehicle registration details",
    placeholder: "Enter registration number",
  },
  {
    id: "v2",
    name: "General Query",
    path: "/v2",
    param: "query",
    description: "General purpose query endpoint",
    placeholder: "Enter your query",
  },
] as const;

export type EndpointId = typeof API_ENDPOINTS[number]["id"];
