// In production, set window.__DINEBOT_API__ via environment or replace this URL
// with your Render backend URL after deployment.
const prodApi = (window as any).__DINEBOT_API__ || 'https://restaurant-chatbot-atvs.onrender.com';

export const environment = {
    apiBaseUrl: (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? prodApi
        : 'http://localhost:3000'
};
