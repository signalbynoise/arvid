const FLASH_CLASS = 'ring-2 ring-border-focus';
const FLASH_DURATION_MS = 1500;

export function scrollToRequirement(id: string): void {
  const el = document.getElementById(`req-${id}`);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const classes = FLASH_CLASS.split(' ');
  el.classList.add(...classes);
  setTimeout(() => el.classList.remove(...classes), FLASH_DURATION_MS);
}
