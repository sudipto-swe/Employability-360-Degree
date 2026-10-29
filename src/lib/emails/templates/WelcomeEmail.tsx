import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  role: "JOB_SEEKER" | "RECRUITER";
}

export const WelcomeEmail = ({ name, role }: WelcomeEmailProps) => {
  const previewText = `Welcome to Employability 360°, ${name}!`;

  const loginUrl = "https://employability360.com/login";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Employability 360°!</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            We&apos;re thrilled to have you on board! You&apos;ve successfully created your account as a{" "}
            <strong>{role === "JOB_SEEKER" ? "Job Seeker" : "Recruiter"}</strong>.
          </Text>

          {role === "JOB_SEEKER" ? (
            <Text style={text}>
              Start by building your AI-powered CV and exploring thousands of opportunities tailored for you in Bangladesh.
            </Text>
          ) : (
            <Text style={text}>
              Start by completing your company profile and posting your first job to attract top talent.
            </Text>
          )}

          <Section style={btnContainer}>
            <Link href={loginUrl} style={button}>
              Go to Dashboard
            </Link>
          </Section>

          <Text style={text}>
            If you have any questions, feel free to reply to this email. We&apos;re here to help!
          </Text>

          <Hr style={hr} />
          
          <Text style={footer}>
            Employability 360° Team<br />
            Dhaka, Bangladesh
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 20px",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6", // tailwind blue-500
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "600",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};
