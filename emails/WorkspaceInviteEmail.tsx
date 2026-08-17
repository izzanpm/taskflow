import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type WorkspaceInviteEmailProps = {
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
  role: "ADMIN" | "MEMBER";
  expiresAt: Date;
};

export function WorkspaceInviteEmail({
  workspaceName,
  inviterName,
  inviteUrl,
  role,
  expiresAt,
}: WorkspaceInviteEmailProps) {
  const formattedExpiry = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(expiresAt);

  return (
    <Html lang="en">
      <Head />
      <Preview>You are invited to join {workspaceName} on TaskFlow.</Preview>
      <Body
        style={{
          backgroundColor: "#F9F8F6",
          color: "#0F172A",
          fontFamily: "Arial, sans-serif",
          lineHeight: 1.6,
          padding: "40px 20px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            margin: "0 auto",
            maxWidth: "560px",
            padding: "32px",
          }}
        >
          <Text style={{ color: "#004BB0", fontSize: "14px", fontWeight: 700 }}>
            TaskFlow
          </Text>
          <Heading
            style={{ fontSize: "26px", fontWeight: 600, lineHeight: 1.2 }}
          >
            You are invited to {workspaceName}.
          </Heading>
          <Text style={{ color: "#475569", fontSize: "15px" }}>
            {inviterName} invited you to join as a{" "}
            {role === "ADMIN" ? "Admin" : "Member"}. Use the button below to
            accept the invitation and start working with the team.
          </Text>
          <Section style={{ margin: "28px 0" }}>
            <Button
              href={inviteUrl}
              style={{
                backgroundColor: "#004BB0",
                color: "#FFFFFF",
                display: "inline-block",
                fontSize: "14px",
                fontWeight: 700,
                padding: "12px 18px",
                textDecoration: "none",
              }}
            >
              Accept invitation
            </Button>
          </Section>
          <Text style={{ color: "#64748B", fontSize: "12px" }}>
            This invitation expires on {formattedExpiry}. If you were not
            expecting it, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
