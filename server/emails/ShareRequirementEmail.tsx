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

export interface ShareRequirementEmailProps {
  url: string;
  requirementTitle?: string;
}

export function ShareRequirementEmail({
  url,
  requirementTitle,
}: ShareRequirementEmailProps) {
  const title = requirementTitle || 'Requirement shared with you';
  const previewText = requirementTitle
    ? `Shared requirement: ${requirementTitle}`
    : 'A requirement has been shared with you on Arvid';

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
            <Text style={label}>SHARED REQUIREMENT</Text>
            <Heading as="h2" style={heading}>
              {title}
            </Heading>
            <Hr style={divider} />
            <Text style={paragraph}>
              Someone shared a requirement with you on Arvid. View the full
              specification, questions, and answers by clicking below.
            </Text>
            <Section style={buttonSection}>
              <Button href={url} style={button}>
                View Requirement
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
            <Text style={footerUrl}>{url}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ShareRequirementEmail.PreviewProps = {
  url: 'https://app.arvid.work/arvid/T-H3AP/P-WHV5/R-FPK3',
  requirementTitle: 'Slack Integration for Message Extraction & Notifications',
} satisfies ShareRequirementEmailProps;

export default ShareRequirementEmail;

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

const heading: React.CSSProperties = {
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
  color: '#7170ff',
  textDecoration: 'none',
};

const footerUrl: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.15)',
  lineHeight: '1.5',
  margin: 0,
  wordBreak: 'break-all' as const,
};
