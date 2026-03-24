/**
 * TerrA Support Portal - Global Configuration
 * 
 * For local development: Leave API_BASE_URL as an empty string.
 * For production (Vercel): Set API_BASE_URL to your Render backend URL.
 */
const CONFIG = {
    // For local development, leave this as an empty string
    API_BASE_URL: "http://janean-unattachable-lachelle.ngrok-free.dev"
    // API_BASE_URL: "http://localhost:3000"
};

// If the URL is set, ensure it doesn't end with a slash
if (CONFIG.API_BASE_URL && CONFIG.API_BASE_URL.endsWith('/')) {
    CONFIG.API_BASE_URL = CONFIG.API_BASE_URL.slice(0, -1);
}
