import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { ThemeContextProvider } from './Context/ThemeContext'
import { ToastProvider } from './Context/ToastContext'
import ToastContainer from './components/Notifications/ToastContainer'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeContextProvider>
        <ToastProvider>
          <App />
          <ToastContainer />
        </ToastProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  </StrictMode>
);
