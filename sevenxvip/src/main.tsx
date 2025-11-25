import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { RegionProvider } from './contexts/RegionContext';
import BlackFridayBanner from './components/BlackFridayBanner';



const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <RegionProvider>
              
        <App />
      </RegionProvider>
    </ThemeProvider>
  </React.StrictMode>
);
