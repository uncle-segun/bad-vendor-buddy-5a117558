import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">BadVendor</span>
          </Link>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: January 28, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using BadVendor ("the Platform"), you agree to be bound by these Terms of Service
            ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            BadVendor is a community-driven platform that allows users to report and search for verified
            complaints about vendors and service providers in Nigeria. The Platform enables:
          </p>
          <ul>
            <li>Submission of misconduct reports against vendors</li>
            <li>Searching for verified complaints about vendors</li>
            <li>Viewing publicly listed vendors with multiple verified complaints</li>
          </ul>

          <h2>3. User Responsibilities</h2>
          <h3>3.1 Truthful Reporting</h3>
          <p>
            Users who submit reports ("Reporters") agree that all information provided is truthful, accurate,
            and based on genuine personal experiences. Submitting false, misleading, or defamatory information
            is strictly prohibited and may result in:
          </p>
          <ul>
            <li>Immediate account suspension or termination</li>
            <li>Removal of submitted reports</li>
            <li>Legal action by affected parties or the Platform</li>
          </ul>

          <h3>3.2 Evidence Requirements</h3>
          <p>
            All reports must be accompanied by supporting evidence such as screenshots, transaction records,
            or other documentation. The Platform reserves the right to reject reports without adequate evidence.
          </p>

          <h3>3.3 Account Security</h3>
          <p>
            Users are responsible for maintaining the confidentiality of their account credentials and for
            all activities that occur under their account.
          </p>

          <h2>4. Report Verification Process</h2>
          <p>
            All submitted reports undergo a moderation process before being made public. The Platform:
          </p>
          <ul>
            <li>Reviews submitted evidence for authenticity and relevance</li>
            <li>May request additional evidence or clarification</li>
            <li>Makes final decisions on report approval or rejection</li>
            <li>Only publicly lists vendors after receiving 3 or more verified complaints from unique reporters</li>
          </ul>

          <h2>5. Severity Classification</h2>
          <p>Reports are classified into three severity levels:</p>
          <ul>
            <li><strong>Critical:</strong> Severe misconduct including fraud, theft, or serious harm</li>
            <li><strong>Risky:</strong> Significant issues such as consistent poor service or deceptive practices</li>
            <li><strong>Unreliable:</strong> Minor issues such as delays or poor communication</li>
          </ul>

          <h2>6. Privacy and Anonymity</h2>
          <p>
            The Platform protects Reporter identities. Personal information of Reporters is never disclosed
            to listed vendors or the public. However, Reporters' identities may be disclosed:
          </p>
          <ul>
            <li>If required by law or court order</li>
            <li>In response to valid legal process</li>
            <li>To protect the rights, property, or safety of the Platform or others</li>
          </ul>

          <h2>7. Dispute Process</h2>
          <p>
            Listed vendors have the right to dispute their listing through our formal dispute process.
            Disputed listings may be reviewed and removed if the vendor provides sufficient evidence
            to invalidate the complaints against them. See our{" "}
            <Link to="/dispute-terms" className="text-primary hover:underline">
              Dispute Terms and Conditions
            </Link>{" "}
            for more information.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            The Platform provides a venue for sharing information and does not guarantee the accuracy,
            completeness, or reliability of any reports or information on the Platform. The Platform
            is not liable for:
          </p>
          <ul>
            <li>Decisions made based on information found on the Platform</li>
            <li>Direct, indirect, incidental, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Actions taken by third parties based on Platform content</li>
          </ul>

          <h2>9. Indemnification</h2>
          <p>
            Users agree to indemnify and hold harmless the Platform, its operators, employees, and
            affiliates from any claims, damages, losses, or expenses arising from:
          </p>
          <ul>
            <li>Violation of these Terms</li>
            <li>Submission of false or defamatory content</li>
            <li>Infringement of any third-party rights</li>
          </ul>

          <h2>10. Intellectual Property</h2>
          <p>
            All content, design, and functionality of the Platform are owned by BadVendor and protected
            by intellectual property laws. Users retain ownership of content they submit but grant the
            Platform a worldwide, non-exclusive license to use, display, and distribute such content.
          </p>

          <h2>11. Modifications to Terms</h2>
          <p>
            The Platform reserves the right to modify these Terms at any time. Users will be notified of
            significant changes, and continued use of the Platform after modifications constitutes
            acceptance of the updated Terms.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising
            from these Terms or use of the Platform shall be resolved in the courts of Nigeria.
          </p>

          <h2>13. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:legal@badvendor.ng" className="text-primary hover:underline">
              legal@badvendor.ng
            </a>
          </p>

          <hr className="my-8" />

          <p className="text-sm text-muted-foreground">
            By using BadVendor, you acknowledge that you have read, understood, and agree to be bound
            by these Terms of Service.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Terms;
