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

interface SubscriptionSuccessEmailProps {
  recruiterName: string;
  planName: string;
  amount: number;
}

export const SubscriptionSuccessEmail = ({
  recruiterName,
  planName,
  amount,
}: SubscriptionSuccessEmailProps) => {
  const previewText = `Your ${planName} subscription is active!`;
  const dashboardUrl = "https://employability360.com/dashboard/recruiter";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Subscription Confirmed 🚀</Heading>
          
          <Text style={text}>Hi {recruiterName},</Text>
          
          <Text style={text}>
            Thank you for upgrading! Your payment of <strong>৳{amount}</strong> was successful, and your <strong>{planName}</strong> subscription is now active.
          </Text>

          <Text style={text}>
            You now have access to premium features, including AI-powered candidate matching and priority support. 
            Start finding the best talent in Bangladesh today!
          </Text>

          <Section style={btnContainer}>
            <Link href={dashboardUrl} style={button}>
              Go to Recruiter Dashboard
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

export default SubscriptionSuccessEmail;

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
