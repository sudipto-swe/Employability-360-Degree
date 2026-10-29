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

interface ApplicationStatusEmailProps {
  jobSeekerName: string;
  companyName: string;
  jobTitle: string;
  status: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN" | string;
}

export const ApplicationStatusEmail = ({
  jobSeekerName,
  companyName,
  jobTitle,
  status,
}: ApplicationStatusEmailProps) => {
  const previewText = `Update on your application for ${jobTitle} at ${companyName}`;

  const dashboardUrl = "https://employability360.com/dashboard/jobseeker/applications";

  const getStatusMessage = () => {
    switch (status) {
      case "SCREENING":
        return "Your application is currently being reviewed by the hiring team.";
      case "INTERVIEW":
        return "Great news! The team would like to move forward with an interview. They will be in touch shortly.";
      case "OFFER":
        return "Congratulations! An offer is being prepared for you.";
      case "REJECTED":
        return "The team has decided to move forward with other candidates at this time. Don&apos;t give up, there are many more opportunities waiting for you!";
      default:
        return `Your application status has been updated to: ${status}`;
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Status Update</Heading>
          
          <Text style={text}>Hi {jobSeekerName},</Text>
          
          <Text style={text}>
            There&apos;s been an update regarding your application for the <strong>{jobTitle}</strong> position at <strong>{companyName}</strong>.
          </Text>

          <Section style={statusContainer}>
            <Text style={statusText}>{getStatusMessage()}</Text>
          </Section>

          <Section style={btnContainer}>
            <Link href={dashboardUrl} style={button}>
              View My Applications
            </Link>
          </Section>

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

export default ApplicationStatusEmail;

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

const statusContainer = {
  backgroundColor: "#f9fafb",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
};

const statusText = {
  ...text,
  margin: "0",
  fontWeight: "500",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
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
