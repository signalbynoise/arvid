import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ArticlePage } from './pages/ArticlePage';
import { ArticlesListPage } from './pages/ArticlesListPage';
import { ChangelogListPage } from './pages/ChangelogListPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { FeaturesListPage } from './pages/FeaturesListPage';
import { IntegrationsListPage } from './pages/IntegrationsListPage';
import { GuidesListPage } from './pages/GuidesListPage';
import { DocsListPage } from './pages/DocsListPage';
import { SagaPage } from './pages/SagaPage';
import { AdminAuthProvider } from './auth/AdminAuthProvider';
import { AdminAuthGuard } from './auth/AdminAuthGuard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminArticleListPage } from './pages/admin/AdminArticleListPage';
import { AdminArticleFormPage } from './pages/admin/AdminArticleFormPage';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesListPage />} />
      <Route path="/integrations" element={<IntegrationsListPage />} />
      <Route path="/articles" element={<ArticlesListPage />} />
      <Route path="/articles/:slug" element={<ArticlePage />} />
      <Route path="/changelog" element={<ChangelogListPage />} />
      <Route path="/changelog/:slug" element={<ChangelogPage />} />
      <Route path="/guides" element={<GuidesListPage />} />
      <Route path="/saga" element={<SagaPage />} />
      <Route path="/docs" element={<DocsListPage />} />

      <Route
        path="/admin/*"
        element={
          <AdminAuthProvider>
            <Routes>
              <Route index element={<Navigate to="/admin/articles" replace />} />
              <Route path="login" element={<AdminLoginPage />} />
              <Route
                path="articles"
                element={
                  <AdminAuthGuard>
                    <AdminArticleListPage />
                  </AdminAuthGuard>
                }
              />
              <Route
                path="articles/new"
                element={
                  <AdminAuthGuard>
                    <AdminArticleFormPage />
                  </AdminAuthGuard>
                }
              />
              <Route
                path="articles/:id/edit"
                element={
                  <AdminAuthGuard>
                    <AdminArticleFormPage />
                  </AdminAuthGuard>
                }
              />
            </Routes>
          </AdminAuthProvider>
        }
      />
    </Routes>
  </BrowserRouter>,
);
