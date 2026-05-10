import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { adminRequest } from '../../lib/api';
import { MDA_OPTIONS } from '../../lib/mdaRegistry';
import type { ArticleRow } from '../../../../shared/schemas/article';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [type, setType] = useState<'article' | 'feature' | 'docs'>('article');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [excerpt, setExcerpt] = useState('');
  const [miniDemoId, setMiniDemoId] = useState('');
  const [author, setAuthor] = useState('');
  const [contentRaw, setContentRaw] = useState('[]');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    adminRequest<ArticleRow>('GET', `/api/cms/articles/${id}`)
      .then((data) => {
        setTitle(data.title);
        setSlug(data.slug);
        setSlugManual(true);
        setType(data.type);
        setStatus(data.status);
        setExcerpt(data.excerpt ?? '');
        setMiniDemoId(data.mini_demo_id ?? '');
        setAuthor(data.author ?? '');
        setContentRaw(JSON.stringify(data.content, null, 2));
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load article';
        setError(message);
        console.error('[error] [admin:articleForm:load]', { id, message });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }, [slugManual]);

  const handleSlugChange = useCallback((value: string) => {
    setSlugManual(true);
    setSlug(value);
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);

    let content: unknown[];
    try {
      content = JSON.parse(contentRaw);
      if (!Array.isArray(content)) throw new Error('Content must be a JSON array');
    } catch {
      setError('Content must be valid JSON (array of blocks)');
      setSaving(false);
      return;
    }

    const body = {
      title,
      slug,
      type,
      status,
      content,
      excerpt: excerpt || null,
      mini_demo_id: miniDemoId || null,
      author: author || null,
    };

    try {
      if (isEditing) {
        await adminRequest('PATCH', `/api/cms/articles/${id}`, body);
      } else {
        await adminRequest('POST', '/api/cms/articles', body);
      }
      navigate('/admin/articles');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      console.error('[error] [admin:articleForm:save]', { message });
    } finally {
      setSaving(false);
    }
  }, [title, slug, type, status, contentRaw, excerpt, miniDemoId, author, isEditing, id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <p className="text-caption text-text-tertiary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="btn-ghost flex items-center gap-1 px-2 py-1"
          >
            <ArrowLeft size={ICON_SIZE.sm} />
            Back
          </button>
          <h1 className="text-h2 text-text-primary">
            {isEditing ? 'Edit article' : 'New article'}
          </h1>
        </div>

        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}

        <div className="flex flex-col gap-6">
          <FieldGroup label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
              placeholder="Article title"
            />
          </FieldGroup>

          <FieldGroup label="Slug">
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
              placeholder="url-slug"
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-3 text-caption-lg text-text-primary focus:border-border-focus focus:outline-none"
              >
                <option value="article">Article</option>
                <option value="feature">Feature</option>
                <option value="docs">Docs</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-3 text-caption-lg text-text-primary focus:border-border-focus focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FieldGroup>
          </div>

          <FieldGroup label="Mini Demo App">
            <select
              value={miniDemoId}
              onChange={(e) => setMiniDemoId(e.target.value)}
              className="rounded-comfortable border border-border-default bg-surface-panel px-3 py-3 text-caption-lg text-text-primary focus:border-border-focus focus:outline-none"
            >
              <option value="">None</option>
              {MDA_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Author">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
              placeholder="Author name"
            />
          </FieldGroup>

          <FieldGroup label="Excerpt">
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="resize-none rounded-comfortable border border-border-default bg-surface-panel p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
              placeholder="Short description for listing cards"
            />
          </FieldGroup>

          <FieldGroup label="Content (JSON blocks)">
            <textarea
              value={contentRaw}
              onChange={(e) => setContentRaw(e.target.value)}
              rows={16}
              className="resize-y rounded-comfortable border border-border-default bg-surface-panel p-3 font-mono text-caption text-text-primary placeholder:text-text-empty focus:border-border-focus focus:outline-none"
              placeholder='[{"type":"paragraph","content":"..."}]'
            />
          </FieldGroup>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || !slug.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create article'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-text-quaternary">{label}</span>
      {children}
    </div>
  );
}
