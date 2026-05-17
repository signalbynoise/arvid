import {
  Html, Head, Preview, Body, Container,
  Heading, Text, Button, Hr, Link, Section, Img,
} from '@react-email/components';
import * as React from 'react';
import {
  body, container, logoSection, card, label, headingStyle,
  divider, paragraph, buttonSection, button, footer, footerText, footerLink,
} from './emailStyles';

export interface ResetPasswordEmailProps {
  url: string;
  email: string;
}

export function ResetPasswordEmail({ url, email }: ResetPasswordEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your Arvid password</Preview>
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
            <Text style={label}>PASSWORD RESET</Text>
            <Heading as="h2" style={headingStyle}>
              Reset your password
            </Heading>
            <Hr style={divider} />
            <Text style={paragraph}>
              We received a request to reset the password for{' '}
              <strong style={{ color: '#d0d6e0' }}>{email}</strong>.
              Click the button below to choose a new password.
            </Text>
            <Section style={buttonSection}>
              <Button href={url} style={button}>
                Reset Password
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              If you didn&apos;t request a password reset, you can safely ignore this email.
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

ResetPasswordEmail.PreviewProps = {
  url: 'https://app.arvid.work/reset-password?token=abc123',
  email: 'erik@arvid.work',
} satisfies ResetPasswordEmailProps;

export default ResetPasswordEmail;
