import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Link,
  Section,
  Img,
} from '@react-email/components';
import * as React from 'react';

export interface InviteEmailProps {
  url: string;
  inviterEmail: string;
  workspaceName: string;
  scope: 'workspace' | 'team' | 'project';
  scopeName?: string;
}

const SCOPE_LABELS: Record<string, string> = {
  workspace: 'workspace',
  team: 'team',
  project: 'project',
};

function buildPreview({ inviterEmail, workspaceName, scope, scopeName }: Omit<InviteEmailProps, 'url'>) {
  const target = scope === 'workspace'
    ? workspaceName
    : `${scopeName ?? SCOPE_LABELS[scope]} in ${workspaceName}`;
  return `${inviterEmail} invited you to ${target} on Arvid`;
}

function buildBody({ inviterEmail, workspaceName, scope, scopeName }: Omit<InviteEmailProps, 'url'>) {
  if (scope === 'workspace') {
    return `${inviterEmail} has invited you to join the ${workspaceName} workspace on Arvid.`;
  }
  const label = SCOPE_LABELS[scope];
  const name = scopeName ?? label;
  return `${inviterEmail} has invited you to the ${name} ${label} in the ${workspaceName} workspace on Arvid.`;
}

export function InviteEmail({
  url,
  inviterEmail,
  workspaceName,
  scope,
  scopeName,
}: InviteEmailProps) {
  const previewText = buildPreview({ inviterEmail, workspaceName, scope, scopeName });
  const bodyText = buildBody({ inviterEmail, workspaceName, scope, scopeName });

  const heading = scope === 'workspace'
    ? workspaceName
    : scopeName ?? SCOPE_LABELS[scope];

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://arvid.work/logo_wide.svg"
              alt="Arvid"
              width="73"
              height="24"
            />
          </Section>

          <Section style={card}>
            <Text style={label}>INVITATION</Text>
            <Heading as="h2" style={headingStyle}>
              {heading}
            </Heading>
            <Hr style={divider} />
            <Text style={paragraph}>{bodyText}</Text>
            <Section style={buttonSection}>
              <Button href={url} style={button}>
                Accept Invitation
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This email was sent from{' '}
              <Link href="https://arvid.work" style={footerLink}>
                arvid.work
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

InviteEmail.PreviewProps = {
  url: 'https://app.arvid.work?invite=1',
  inviterEmail: 'erik@arvid.work',
  workspaceName: 'Arvid',
  scope: 'team',
  scopeName: 'Engineering',
} satisfies InviteEmailProps;

export default InviteEmail;

const body: React.CSSProperties = {
  backgroundColor: '#08090a',
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: '48px 24px',
};

const container: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
};

const logoSection: React.CSSProperties = {
  paddingBottom: '40px',
};

const card: React.CSSProperties = {
  backgroundColor: '#0f1011',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '32px',
};

const label: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 510,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#62666d',
  margin: '0 0 12px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 510,
  color: '#f7f8f8',
  lineHeight: '1.4',
  letterSpacing: '-0.2px',
  margin: '0 0 24px',
};

const divider: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.05)',
  margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 400,
  color: '#8a8f98',
  lineHeight: '1.6',
  margin: '0 0 28px',
};

const buttonSection: React.CSSProperties = {};

const button: React.CSSProperties = {
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

const footer: React.CSSProperties = {
  paddingTop: '32px',
};

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#62666d',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const footerLink: React.CSSProperties = {
  color: '#d0d6e0',
  textDecoration: 'underline',
  textDecorationStyle: 'dashed' as const,
  textUnderlineOffset: '3px',
};
