import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import CatalogManager from './pages/CatalogManager';

const root = ReactDOM.createRoot(document.getElementById('root'));
const path = window.location.pathname;
root.render(
  <React.StrictMode>
    {path === '/catalog' ? <CatalogManager /> : <App />}
  </React.StrictMode>
);

reportWebVitals();
