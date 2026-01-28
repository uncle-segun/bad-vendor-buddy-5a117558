import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const DisputeTerms = () => {
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
          <h1>Dispute & Erasure Request Terms</h1>
          <p className="lead">Last updated: January 28, 2026</p>

          <h2>1. Purpose of This Agreement</h2>
          <p>
            These terms govern the process by which individuals listed on BadVendor ("Listed Party")
            may request review and potential removal of their listing. By submitting a dispute request,
            you agree to be bound by these terms.
          </p>

          <h2>2. Eligibility for Dispute</h2>
          <p>
            You may submit a dispute request if:
          </p>
          <ul>
            <li>You are the individual or authorized representative of the business listed on BadVendor</li>
            <li>You believe the listing contains inaccurate information</li>
            <li>You have evidence that contradicts the complaints filed against you</li>
            <li>The circumstances of the original complaints have been resolved</li>
          </ul>

          <h2>3. Required Information</h2>
          <p>All dispute requests must include:</p>
          <ul>
            <li><strong>Identity Verification:</strong> A valid government-issued ID (National ID, Driver's License, International Passport, or Voter's Card)</li>
            <li><strong>Contact Information:</strong> Full legal name, email address, and phone number</li>
            <li><strong>Detailed Explanation:</strong> A comprehensive explanation of why the listing should be removed</li>
            <li><strong>Supporting Evidence:</strong> Documents, communications, or other evidence supporting your dispute</li>
          </ul>

          <h2>4. Verification Process</h2>
          <p>Upon receiving your dispute request, BadVendor will:</p>
          <ul>
            <li>Verify your identity using the provided documentation</li>
            <li>Review all evidence submitted with your dispute</li>
            <li>Cross-reference with original complaints and evidence</li>
            <li>Contact you if additional information is required</li>
            <li>Make a final determination within 14-30 business days</li>
          </ul>

          <h2>5. Possible Outcomes</h2>
          <h3>5.1 Dispute Approved</h3>
          <p>
            If your dispute is approved, the listing may be:
          </p>
          <ul>
            <li>Removed entirely from the Platform</li>
            <li>Modified to reflect accurate information</li>
            <li>Annotated with an update reflecting resolution</li>
          </ul>

          <h3>5.2 Dispute Rejected</h3>
          <p>
            If your dispute is rejected, the listing will remain unchanged. You may submit
            a new dispute with additional evidence after 90 days.
          </p>

          <h2>6. Truthfulness Declaration</h2>
          <p>
            By submitting a dispute request, you declare under penalty of law that:
          </p>
          <ul>
            <li>All information provided is truthful and accurate</li>
            <li>All documents submitted are genuine and unaltered</li>
            <li>You are authorized to make this request</li>
            <li>You understand that false statements may result in legal action</li>
          </ul>

          <h2>7. Consequences of False Information</h2>
          <p>
            Submitting false information in a dispute request is a serious offense and may result in:
          </p>
          <ul>
            <li>Immediate rejection of the dispute</li>
            <li>Permanent ban from the dispute process</li>
            <li>Reporting to relevant authorities</li>
            <li>Civil or criminal legal action</li>
            <li>Public notation on the listing regarding the false dispute attempt</li>
          </ul>

          <h2>8. Data Handling</h2>
          <p>
            Information submitted with your dispute request will be:
          </p>
          <ul>
            <li>Stored securely and confidentially</li>
            <li>Used only for verification and decision-making purposes</li>
            <li>Retained for a minimum of 5 years for legal compliance</li>
            <li>Not shared with third parties except as required by law</li>
          </ul>

          <h2>9. No Guarantee of Removal</h2>
          <p>
            Submitting a dispute request does not guarantee removal of your listing. BadVendor
            maintains sole discretion over all listing decisions and the final determination
            is at our absolute discretion.
          </p>

          <h2>10. Waiver of Claims</h2>
          <p>
            By submitting a dispute request, you waive any claims against BadVendor, its operators,
            employees, and affiliates arising from:
          </p>
          <ul>
            <li>The dispute review process</li>
            <li>The decision to approve or reject your dispute</li>
            <li>The continued display of your listing if the dispute is rejected</li>
            <li>Any modifications made to your listing</li>
          </ul>

          <h2>11. Appeals</h2>
          <p>
            If your dispute is rejected, you may submit an appeal within 30 days by providing
            new evidence not previously considered. Appeals are subject to a final review
            and the decision on appeal is not subject to further review.
          </p>

          <h2>12. Legal Jurisdiction</h2>
          <p>
            Any legal disputes arising from the dispute process shall be governed by the laws
            of the Federal Republic of Nigeria and resolved in Nigerian courts.
          </p>

          <h2>13. Modifications</h2>
          <p>
            BadVendor reserves the right to modify these terms at any time. The terms in effect
            at the time of your dispute submission will govern your request.
          </p>

          <h2>14. Contact</h2>
          <p>
            For questions about the dispute process, contact us at{" "}
            <a href="mailto:disputes@badvendor.ng" className="text-primary hover:underline">
              disputes@badvendor.ng
            </a>
          </p>

          <hr className="my-8" />

          <p className="text-sm text-muted-foreground">
            By proceeding with a dispute request, you confirm that you have read, understood,
            and agree to these Dispute & Erasure Request Terms.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DisputeTerms;
