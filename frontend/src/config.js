// Centralized dynamic API configuration for Localhost and Mobile Network access
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8086`;
    }
  }
  return "http://127.0.0.1:8086";
};

export const API_URL = getApiUrl();
