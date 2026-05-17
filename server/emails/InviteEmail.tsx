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
import {
  body, container, logoSection, card, label, headingStyle,
  divider, paragraph, buttonSection, button, footer, footerText, footerLink,
} from './emailStyles';

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
  url: 'https://app.arvid.work?invite=1&email=erik%40arvid.work',
  inviterEmail: 'erik@arvid.work',
  workspaceName: 'Arvid',
  scope: 'team',
  scopeName: 'Engineering',
} satisfies InviteEmailProps;

export default InviteEmail;
