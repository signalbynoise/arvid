import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { adminRequest } from '../../lib/api';
import type { ArticleRow } from '../../../../shared/schemas/article';
import type { ArticleStatus, ArticleType } from '../../../../shared/schemas/article';

type FilterStatus = ArticleStatus | 'all';
type FilterType = ArticleType | 'all';

export function AdminArticleListPage() {
  const { signOut } = useAdminAuth();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterType !== 'all') params.set('type', filterType);
      const query = params.toString();
      const path = `/api/cms/articles${query ? `?${query}` : ''}`;
      const data = await adminRequest<ArticleRow[]>('GET', path);
      setArticles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles';
      setError(message);
      console.error('[error] [admin:articleList] Failed to fetch articles', { message });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = useCallback(async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await adminRequest('DELETE', `/api/cms/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      console.error('[error] [admin:articleList:delete] Failed to delete article', { id, message });
      alert(message);
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-base px-6 py-6 md:px-10 md:py-10">
      <div className="mx-auto flex max-w-article-content flex-col gap-6 md:gap-8 lg:max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-h3 text-text-primary md:text-h2">Articles</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/articles/new"
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={ICON_SIZE.sm} />
              New article
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="btn-ghost flex items-center gap-2"
              title="Sign out"
            >
              <LogOut size={ICON_SIZE.sm} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-label text-text-quaternary" htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-1.5 text-caption text-text-primary focus:border-border-focus focus:outline-none"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-label text-text-quaternary" htmlFor="filter-type">Type</label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-1.5 text-caption text-text-primary focus:border-border-focus focus:outline-none"
            >
              <option value="all">All</option>
              <option value="article">Article</option>
              <option value="feature">Feature</option>
              <option value="docs">Docs</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}

        {loading ? (
          <p className="text-caption text-text-tertiary">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-caption text-text-tertiary">No articles found.</p>
        ) : (
          <div className="flex flex-col gap-2 md:gap-1">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col gap-3 rounded-card border border-border-default bg-surface-panel px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-caption-lg text-text-primary">
                      {article.title}
                    </span>
                    <StatusBadge status={article.status} />
                    <TypeBadge type={article.type} />
                  </div>
                  <span className="text-tiny text-text-quaternary">
                    /{article.slug}
                    {article.updated_at && ` · Updated ${new Date(article.updated_at).toLocaleDateString()}`}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/admin/articles/${article.id}/edit`}
                    className="btn-ghost flex items-center gap-1 px-2 py-1"
                    title="Edit"
                  >
                    <Pencil size={ICON_SIZE.sm} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(article.id, article.title)}
                    className="btn-ghost flex items-center gap-1 px-2 py-1 text-status-error"
                    title="Delete"
                  >
                    <Trash2 size={ICON_SIZE.sm} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === 'published';
  return (
    <span
      className={`rounded-pill px-2 py-0.5 text-tiny ${
        isPublished
          ? 'bg-status-success-surface text-status-success'
          : 'bg-surface-frost-04 text-text-tertiary'
      }`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded-pill bg-surface-frost-02 px-2 py-0.5 text-tiny text-text-quaternary">
      {type}
    </span>
  );
}
