import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a module logger with all log levels', () => {
    const log = logger.create('TestModule');
    expect(log.debug).toBeTypeOf('function');
    expect(log.info).toBeTypeOf('function');
    expect(log.warn).toBeTypeOf('function');
    expect(log.error).toBeTypeOf('function');
  });

  it('logs error messages with context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = logger.create('api');

    log.error('fetch', 'Request failed', { status: 404 });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] [api:fetch] Request failed'),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('"status":404'),
    );
  });

  it('logs info messages without context', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const log = logger.create('App');

    log.info('init', 'Application started');

    expect(spy).toHaveBeenCalledWith('[INFO] [App:init] Application started');
  });

  it('includes module name and operation in debug output', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const log = logger.create('Sidebar');

    log.debug('toggle', 'Sidebar toggled');

    expect(spy).toHaveBeenCalledWith('[DEBUG] [Sidebar:toggle] Sidebar toggled');
  });

  it('logs warn messages with context', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = logger.create('State');

    log.warn('stale', 'Data might be stale', { age: 30000 });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN] [State:stale] Data might be stale'),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('"age":30000'),
    );
  });
});
