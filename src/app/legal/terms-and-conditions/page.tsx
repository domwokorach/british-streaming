import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Placeholder, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions | British Streaming",
  description: "The terms that apply when you use British Streaming.",
  alternates: { canonical: "/legal/terms-and-conditions" },
};

// Structure only. Every provision marked as a placeholder needs review and wording from qualified legal counsel.
const sections: LegalSection[] = [
  { id: "introduction", heading: "Introduction and acceptance of terms", body: (<>
    <p>These Terms &amp; Conditions govern your use of British Streaming (the “Service”). By creating an account or using the Service you agree to them, together with our <Link href="/privacy">Privacy Policy</Link>.</p>
    <p><Placeholder>Legal entity name, registered address and governing law to be supplied by counsel.</Placeholder></p>
  </>) },
  { id: "accounts", heading: "User accounts and responsibilities", body: (<>
    <p>You need an account to access some features. You are responsible for the accuracy of the details you give, for keeping your password confidential, and for activity under your account.</p>
    <p><Placeholder>Minimum age, one-account-per-person and household rules to be confirmed.</Placeholder></p>
  </>) },
  { id: "subscriptions", heading: "Subscription plans and billing", body: (<>
    <p><Placeholder>Plans, prices, billing cycle, free-trial terms, cancellation and refund policy. Include only if paid plans are offered.</Placeholder></p>
  </>) },
  { id: "content", heading: "Streaming content usage and licensing", body: (<>
    <p>Content on the Service is made available for personal, non-commercial viewing. Availability varies by title and region and may change without notice.</p>
    <p><Placeholder>Licence scope, device and concurrent-stream limits, and regional restrictions to be confirmed against content agreements.</Placeholder></p>
  </>) },
  { id: "ip", heading: "Intellectual property rights", body: (<>
    <p>The Service and its content are protected by copyright and other intellectual property laws. Except for the limited right to view content through the Service, no rights are granted to you.</p>
    <p><Placeholder>Ownership statements and third-party attributions (including metadata provider credits) to be confirmed.</Placeholder></p>
  </>) },
  { id: "prohibited", heading: "Prohibited activities", body: (<>
    <p>You must not, for example:</p>
    <ul><li>copy, record, redistribute or publicly perform content;</li><li>circumvent access controls, content protection or regional restrictions;</li><li>use automated tools to scrape or overload the Service;</li><li>share your credentials or attempt to access other people’s accounts.</li></ul>
    <p><Placeholder>Final list of prohibited conduct to be reviewed by counsel.</Placeholder></p>
  </>) },
  { id: "termination", heading: "Account suspension and termination", body: (<>
    <p>You may stop using the Service and close your account at any time. We may suspend or end access if these terms are breached or to protect the Service and other users.</p>
    <p><Placeholder>Notice periods, appeal process and effect of termination on paid balances.</Placeholder></p>
  </>) },
  { id: "availability", heading: "Service availability and limitations", body: (<>
    <p>We aim to keep the Service available but do not guarantee uninterrupted or error-free access. Features and content may change, and streaming quality depends on your device and connection.</p>
  </>) },
  { id: "liability", heading: "Disclaimers and limitation of liability", body: (<>
    <p><Placeholder>Warranty disclaimers, limitation and exclusion of liability, and indemnity wording. These must be drafted by counsel and must respect consumer-law rights in each jurisdiction.</Placeholder></p>
  </>) },
  { id: "changes", heading: "Changes to these terms", body: (<>
    <p>We may update these terms from time to time. The “last updated” date above shows when they last changed. Continued use after an update means you accept the revised terms.</p>
    <p><Placeholder>How material changes will be notified to users.</Placeholder></p>
  </>) },
  { id: "contact", heading: "Contact information", body: (<>
    <p>Questions about these terms: <Placeholder>legal contact email and postal address</Placeholder>. You can also read our <Link href="/accessibility">Accessibility statement</Link>.</p>
  </>) },
];

export default function Page() {
  return (
    <LegalPage
      title="Terms & Conditions"
      meta={<>Effective date: <Placeholder>date</Placeholder> · Last updated: <Placeholder>date</Placeholder></>}
      intro={<p>This is a draft structure. Sections marked <Placeholder>like this</Placeholder> require legal review and are not yet binding terms.</p>}
      sections={sections}
    />
  );
}
