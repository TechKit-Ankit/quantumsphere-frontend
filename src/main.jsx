import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'
import { API_URL, API_ENDPOINTS } from './config'

// Immediate API check to see if backend is available
const checkBackendConnection = async () => {
  try {
    const startTime = Date.now();
    console.log(`Checking backend connectivity at ${API_URL}...`);

    // Set timeout to 2 seconds for quick response
    const response = await axios.get(`${API_URL}${API_ENDPOINTS.HEALTH}`, {
      timeout: 2000
    }).catch(e => {
      // Try a general request if health endpoint doesn't exist
      return axios.get(`${API_URL}${API_ENDPOINTS.HEALTH}`);
    });

    const elapsedTime = Date.now() - startTime;
    console.log(`Backend connection successful in ${elapsedTime}ms`);
    return true;
  } catch (error) {
    console.warn(`Backend connection failed: ${error.message}`);

    // Add a warning banner if we can't reach the backend
    const warningBanner = document.createElement('div');
    warningBanner.style = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f44336;
      color: white;
      padding: 10px;
      text-align: center;
      z-index: 9999;
      font-family: sans-serif;
    `;
    warningBanner.innerHTML = `
      <strong>Warning:</strong> Unable to connect to the backend server (${API_URL}). 
      Some features may not work. 
      <button id="dismiss-warning" style="background: white; color: #f44336; border: none; padding: 5px 10px; margin-left: 10px; cursor: pointer; border-radius: 4px;">
        Dismiss
      </button>
    `;

    document.body.appendChild(warningBanner);

    // Allow dismissing the warning
    document.getElementById('dismiss-warning')?.addEventListener('click', () => {
      warningBanner.remove();
    });

    return false;
  }
};

// Attempt the connection check
checkBackendConnection();

// Add global error handler to prevent white screen of death
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);

  // Prevent the app from completely failing if there's an error
  if (document.body.innerHTML === '') {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <h1>Something went wrong</h1>
        <p>The application encountered an error. Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()" style="padding:10px 20px;margin-top:20px;cursor:pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Set a timeout to handle potential infinite loading
setTimeout(() => {
  const root = document.getElementById('root');

  // Check if the app is still showing just a loading screen
  if (root && (!root.childNodes.length || root.innerHTML.includes('Loading'))) {
    console.warn('Application may be stuck loading. Adding fallback UI.');

    // Create a manual refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.innerText = 'App is taking too long to load. Click to refresh';
    refreshBtn.style = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:10px 20px;background:#1976d2;color:white;border:none;border-radius:4px;cursor:pointer;z-index:9999;';
    refreshBtn.onclick = () => window.location.reload();

    document.body.appendChild(refreshBtn);
  }
}, 20000); // 20 seconds timeout

// Start the application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
