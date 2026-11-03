import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Placeholder, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Accessibility | British Streaming",
  description: "How British Streaming approaches accessibility, what is supported today, known limitations and how to contact us.",
  alternates: { canonical: "/accessibility" },
};

const sections: LegalSection[] = [
  { id: "commitment", heading: "Our commitment", body: (<>
    <p>We want everyone to be able to browse and watch on British Streaming. Our target is WCAG 2.2 Level AA across the application. This is a goal: the site has not yet had a formal accessibility evaluation, so we do not claim conformance.</p>
  </>) },
  { id: "keyboard", heading: "Keyboard navigation", body: (<>
    <ul>
      <li>Links, buttons, form fields and dialogs can be reached and operated with Tab, Shift+Tab, Enter and Space.</li>
      <li>Content rows and the featured banner respond to the Left and Right arrow keys.</li>
      <li>Title details open in a dialog that can be closed with Escape.</li>
    </ul>
  </>) },
  { id: "screen-readers", heading: "Screen-reader compatibility", body: (<>
    <p>We use semantic landmarks (header, main, navigation, footer), labelled controls and carousel/slide roles so assistive technology can identify page structure. Testing with specific screen readers is still to be completed: <Placeholder>list tested screen reader and browser combinations once testing is done.</Placeholder></p>
  </>) },
  { id: "captions", heading: "Captions and subtitles", body: (<>
    <p>Availability of captions and subtitles depends on the title and the video provider. <Placeholder>State the captions and audio-description coverage the player actually offers, once confirmed.</Placeholder></p>
  </>) },
  { id: "motion", heading: "Reduced motion", body: (<>
    <p>If your device is set to reduce motion, animations such as entrance effects, carousel autoplay and border effects are toned down or switched off. Featured-banner and row autoplay can also be paused with the on-screen control.</p>
  </>) },
  { id: "contrast", heading: "Colour contrast and readability", body: (<>
    <p>The interface uses light text on dark backgrounds and is designed to meet AA contrast ratios. Contrast on imagery such as posters and artwork varies and has not been fully audited.</p>
  </>) },
  { id: "focus", heading: "Focus indicators", body: (<>
    <p>Interactive elements show a visible focus ring or outline when reached by keyboard.</p>
  </>) },
  { id: "zoom", heading: "Responsive text and zoom", body: (<>
    <p>Layouts are responsive and are designed to remain usable when text is enlarged or the page is zoomed up to 200%. You can also use your browser’s own text-size and zoom settings.</p>
  </>) },
  { id: "limitations", heading: "Known limitations", body: (<>
    <ul>
      <li>Embedded trailers and third-party players may not offer the same accessibility features as the rest of the site.</li>
      <li>Hover previews on content cards are a pointer-only enhancement; the same information is available in the title dialog.</li>
      <li>Some poster images use decorative alternative text because the title is given in the adjacent control.</li>
    </ul>
    <p><Placeholder>Add issues found during formal testing.</Placeholder></p>
  </>) },
  { id: "feedback", heading: "Feedback and contact", body: (<>
    <p>If you find a barrier or need content in another format, please tell us: <Placeholder>accessibility contact email, phone and expected response time</Placeholder>. See also our <Link href="/legal/terms-and-conditions">Terms &amp; Conditions</Link>.</p>
  </>) },
  { id: "reviewed", heading: "Last reviewed", body: (<>
    <p>This statement was last reviewed on 3 November 2026. It reflects an internal content review, not an independent audit.</p>
  </>) },
];

export default function Page() {
  return (
    <LegalPage
      title="Accessibility"
      meta={<>Last reviewed: 3 November 2026 · Target: WCAG 2.2 AA</>}
      intro={<p>How British Streaming supports people with different abilities, and where we still have work to do.</p>}
      sections={sections}
    />
  );
}
