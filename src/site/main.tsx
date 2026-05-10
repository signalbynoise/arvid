import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ArticlePage } from './pages/ArticlePage';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/articles/:slug" element={<ArticlePage />} />
    </Routes>
  </BrowserRouter>,
);
