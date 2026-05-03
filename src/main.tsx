import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './app/auth/AuthProvider';
import { AuthGuard } from './app/auth/AuthGuard';
import App from './app/App';
import { LoginPage } from './app/pages/LoginPage';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <App />
            </AuthGuard>
          }
        />
      </Routes>
    </AuthProvider>
  </BrowserRouter>,
);
