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
    id: "aadhaar",
    name: "Aadhaar Lookup",
    path: "/aadhaar",
    param: "aadhaar",
    description: "Get details by Aadhaar number",
    placeholder: "Enter Aadhaar number",
  },
  {
    id: "gst",
    name: "GST Lookup",
    path: "/gst",
    param: "gst",
    description: "Get GST details",
    placeholder: "Enter GST number",
  },
  {
    id: "telegram",
    name: "Telegram Lookup",
    path: "/telegram",
    param: "telegram",
    description: "Get Telegram user details",
    placeholder: "Enter Telegram username",
  },
  {
    id: "ifsc",
    name: "IFSC Lookup",
    path: "/ifsc",
    param: "ifsc",
    description: "Get bank details by IFSC code",
    placeholder: "Enter IFSC code",
  },
  {
    id: "rashan",
    name: "Ration Card Lookup",
    path: "/rashan",
    param: "rashan",
    description: "Get ration card details",
    placeholder: "Enter ration card number",
  },
  {
    id: "upi",
    name: "UPI Lookup",
    path: "/upi",
    param: "upi",
    description: "Get UPI ID details",
    placeholder: "Enter UPI ID",
  },
  {
    id: "upi2",
    name: "UPI Lookup v2",
    path: "/upi2",
    param: "upi",
    description: "Get UPI ID details (v2)",
    placeholder: "Enter UPI ID",
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
  {
    id: "pan",
    name: "PAN Lookup",
    path: "/pan",
    param: "pan",
    description: "Get PAN card details",
    placeholder: "Enter PAN number",
  },
] as const;

export type EndpointId = typeof API_ENDPOINTS[number]["id"];
