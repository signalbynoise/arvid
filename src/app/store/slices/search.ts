import { StateCreator } from 'zustand';
import { SearchResult } from '../../types';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:search');

const SEARCH_PAGE_SIZE = 50;

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SearchSlice {
  searchQuery: string;
  searchResults: SearchResult[];
  searchStatus: SearchStatus;
  searchHasMore: boolean;
  searchOffset: number;
  searchAbortController: AbortController | null;

  performSearch: (query: string) => void;
  loadMoreSearchResults: () => void;
  clearSearch: () => void;
}

export const createSearchSlice: StateCreator<SearchSlice, [], [], SearchSlice> = (set, get) => ({
  searchQuery: '',
  searchResults: [],
  searchStatus: 'idle',
  searchHasMore: false,
  searchOffset: 0,
  searchAbortController: null,

  performSearch: (query: string) => {
    const prev = get().searchAbortController;
    if (prev) prev.abort();

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      set({
        searchQuery: trimmed,
        searchResults: [],
        searchStatus: 'idle',
        searchHasMore: false,
        searchOffset: 0,
        searchAbortController: null,
      });
      return;
    }

    const controller = new AbortController();
    set({
      searchQuery: trimmed,
      searchResults: [],
      searchStatus: 'loading',
      searchHasMore: false,
      searchOffset: 0,
      searchAbortController: controller,
    });

    log.debug('performSearch', 'Searching', { query: trimmed });

    api
      .search(trimmed, 0, SEARCH_PAGE_SIZE, controller.signal)
      .then(results => {
        if (controller.signal.aborted) return;
        log.info('performSearch', 'Search completed', { query: trimmed, count: results.length });
        set({
          searchResults: results,
          searchStatus: 'ready',
          searchHasMore: results.length >= SEARCH_PAGE_SIZE,
          searchOffset: results.length,
          searchAbortController: null,
        });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Search failed';
        log.error('performSearch', 'Search failed', { query: trimmed, error: message });
        set({
          searchStatus: 'error',
          searchAbortController: null,
        });
      });
  },

  loadMoreSearchResults: () => {
    const { searchQuery, searchOffset, searchHasMore, searchStatus, searchAbortController } = get();
    if (!searchHasMore || searchStatus === 'loading') return;

    if (searchAbortController) searchAbortController.abort();

    const controller = new AbortController();
    set({ searchStatus: 'loading', searchAbortController: controller });

    log.debug('loadMore', 'Loading more results', { query: searchQuery, offset: searchOffset });

    api
      .search(searchQuery, searchOffset, SEARCH_PAGE_SIZE, controller.signal)
      .then(results => {
        if (controller.signal.aborted) return;
        const current = get().searchResults;
        set({
          searchResults: [...current, ...results],
          searchStatus: 'ready',
          searchHasMore: results.length >= SEARCH_PAGE_SIZE,
          searchOffset: searchOffset + results.length,
          searchAbortController: null,
        });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Load more failed';
        log.error('loadMore', 'Load more failed', { error: message });
        set({
          searchStatus: 'error',
          searchAbortController: null,
        });
      });
  },

  clearSearch: () => {
    const prev = get().searchAbortController;
    if (prev) prev.abort();

    set({
      searchQuery: '',
      searchResults: [],
      searchStatus: 'idle',
      searchHasMore: false,
      searchOffset: 0,
      searchAbortController: null,
    });
  },
});
