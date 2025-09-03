// frontend/src/main.jsx (Final Version with StrictMode Removed)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// CRITICAL: CSS imports must be present
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode has been completely removed from around the <App /> component
  <App />
);