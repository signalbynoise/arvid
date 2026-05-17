import type React from 'react';

export const body: React.CSSProperties = {
  backgroundColor: '#08090a',
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: '48px 24px',
};

export const container: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
};

export const logoSection: React.CSSProperties = {
  paddingBottom: '40px',
};

export const card: React.CSSProperties = {
  backgroundColor: '#0f1011',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '32px',
};

export const label: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 510,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#62666d',
  margin: '0 0 12px',
};

export const headingStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 510,
  color: '#f7f8f8',
  lineHeight: '1.4',
  letterSpacing: '-0.2px',
  margin: '0 0 24px',
};

export const divider: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.05)',
  margin: '0 0 24px',
};

export const paragraph: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 400,
  color: '#8a8f98',
  lineHeight: '1.6',
  margin: '0 0 28px',
};

export const buttonSection: React.CSSProperties = {};

export const button: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 20px',
  backgroundColor: '#f7f8f8',
  color: '#000000',
  fontSize: '13px',
  fontWeight: 510,
  textDecoration: 'none',
  borderRadius: '6px',
  letterSpacing: '-0.13px',
};

export const footer: React.CSSProperties = {
  paddingTop: '32px',
};

export const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#62666d',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

export const footerLink: React.CSSProperties = {
  color: '#d0d6e0',
  textDecoration: 'underline',
  textDecorationStyle: 'dashed' as const,
  textUnderlineOffset: '3px',
};
