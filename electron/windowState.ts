import { app, screen, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

interface WindowBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const DEFAULTS: WindowBounds = {
  width: 1280,
  height: 800,
  isMaximized: false,
};

function getStorePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function readState(): WindowBounds {
  try {
    const raw = fs.readFileSync(getStorePath(), 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function writeState(state: WindowBounds): void {
  try {
    fs.mkdirSync(path.dirname(getStorePath()), { recursive: true });
    fs.writeFileSync(getStorePath(), JSON.stringify(state, null, 2));
  } catch {
    // Non-critical; swallow write errors
  }
}

function boundsAreOnScreen(bounds: WindowBounds): boolean {
  if (bounds.x === undefined || bounds.y === undefined) {
    return false;
  }

  const displays = screen.getAllDisplays();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return displays.some(display => {
    const { x, y, width, height } = display.workArea;
    return centerX >= x && centerX <= x + width
      && centerY >= y && centerY <= y + height;
  });
}

export function restoreWindowState(): WindowBounds {
  const saved = readState();

  if (!boundsAreOnScreen(saved)) {
    return DEFAULTS;
  }

  return saved;
}

export function trackWindowState(win: BrowserWindow): void {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  function save(): void {
    if (win.isDestroyed()) return;

    const isMaximized = win.isMaximized();
    const bounds = win.getBounds();

    writeState({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    });
  }

  function debouncedSave(): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(save, 500);
  }

  win.on('resize', debouncedSave);
  win.on('move', debouncedSave);
  win.on('close', save);
}
