import {
  Html, Head, Preview, Body, Container,
  Heading, Text, Button, Hr, Link, Section, Img,
} from '@react-email/components';
import * as React from 'react';
import {
  body, container, logoSection, card, label, headingStyle,
  divider, paragraph, buttonSection, button, footer, footerText, footerLink,
} from './emailStyles';

export interface ConfirmSignupEmailProps {
  url: string;
  email: string;
}

export function ConfirmSignupEmail({ url, email }: ConfirmSignupEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Confirm your Arvid account</Preview>
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
            <Text style={label}>CONFIRM YOUR ACCOUNT</Text>
            <Heading as="h2" style={headingStyle}>
              Welcome to Arvid
            </Heading>
            <Hr style={divider} />
            <Text style={paragraph}>
              Click the button below to verify <strong style={{ color: '#d0d6e0' }}>{email}</strong> and
              activate your account.
            </Text>
            <Section style={buttonSection}>
              <Button href={url} style={button}>
                Confirm Email
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              If you didn&apos;t create an account on Arvid, you can safely ignore this email.
            </Text>
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

ConfirmSignupEmail.PreviewProps = {
  url: 'https://app.arvid.work/confirm?token=abc123',
  email: 'erik@arvid.work',
} satisfies ConfirmSignupEmailProps;

export default ConfirmSignupEmail;
