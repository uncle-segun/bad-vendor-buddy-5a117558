import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, ArrowLeft, Phone, Mail, Building, Calendar, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Vendor = Tables<"vendors">;
type Complaint = Tables<"complaints">;

const severityConfig = {
  critical: {
    label: "Critical",
    description: "Severe cases involving significant financial loss, identity theft, or criminal activity. High risk of harm.",
    color: "bg-severity-critical text-severity-critical-foreground",
    borderColor: "border-severity-critical/30",
    bgColor: "bg-severity-critical/5",
    textColor: "text-severity-critical",
  },
  risky: {
    label: "Risky",
    description: "Serious issues with partial delivery or significant deception. Exercise caution if transacting.",
    color: "bg-severity-risky text-severity-risky-foreground",
    borderColor: "border-severity-risky/30",
    bgColor: "bg-severity-risky/5",
    textColor: "text-severity-risky",
  },
  unreliable: {
    label: "Unreliable",
    description: "Pattern of poor service or minor issues. May be acceptable for low-risk transactions.",
    color: "bg-severity-unreliable text-severity-unreliable-foreground",
    borderColor: "border-severity-unreliable/30",
    bgColor: "bg-severity-unreliable/5",
    textColor: "text-severity-unreliable",
  },
};

const Vendor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!id) return;

      try {
        // Fetch vendor
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", id)
          .eq("is_public", true)
          .single();

        if (vendorError) throw vendorError;
        setVendor(vendorData);

        // Fetch approved complaints for this vendor
        const { data: complaintsData, error: complaintsError } = await supabase
          .from("complaints")
          .select("*")
          .eq("vendor_id", id)
          .eq("status", "approved")
          .order("submitted_at", { ascending: false });

        if (complaintsError) throw complaintsError;
        setComplaints(complaintsData || []);
      } catch (error) {
        console.error("Error fetching vendor:", error);
        navigate("/search");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendor();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Vendor not found</h2>
          <Button onClick={() => navigate("/search")}>Back to search</Button>
        </div>
      </div>
    );
  }

  const severity = vendor.highest_severity || "unreliable";
  const config = severityConfig[severity];
  const bankAccounts = vendor.bank_accounts as { bank: string; account_number: string; account_name?: string }[] | null;
  const socialHandles = vendor.social_handles as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">BadVendor</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/report")}>
            Report Vendor
          </Button>
        </div>
      </header>

      {/* Severity Banner */}
      <section className={`py-6 ${config.bgColor} border-b ${config.borderColor}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${config.color} flex items-center justify-center`}>
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{vendor.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Vendor Details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Report Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified Complaints</span>
                    <span className="font-semibold text-foreground">{vendor.verified_complaint_count || 0}</span>
                  </div>
                  {vendor.first_complaint_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">First Reported</span>
                      <span className="font-semibold text-foreground">
                        {new Date(vendor.first_complaint_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity</span>
                    <span className={`font-semibold ${config.textColor}`}>{config.label}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Known Identifiers</h3>
                <div className="space-y-4">
                  {vendor.phone_numbers && vendor.phone_numbers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <Phone className="h-4 w-4" />
                        Phone Numbers
                      </div>
                      <div className="space-y-1">
                        {vendor.phone_numbers.map((phone, i) => (
                          <p key={i} className="text-foreground font-mono">{phone}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {vendor.email_addresses && vendor.email_addresses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <Mail className="h-4 w-4" />
                        Email Addresses
                      </div>
                      <div className="space-y-1">
                        {vendor.email_addresses.map((email, i) => (
                          <p key={i} className="text-foreground break-all">{email}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {bankAccounts && bankAccounts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <Building className="h-4 w-4" />
                        Bank Accounts
                      </div>
                      <div className="space-y-2">
                        {bankAccounts.map((account, i) => (
                          <div key={i} className="text-foreground">
                            <p className="font-mono">{account.account_number}</p>
                            <p className="text-sm text-muted-foreground">{account.bank}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {socialHandles && Object.keys(socialHandles).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <ExternalLink className="h-4 w-4" />
                        Social Media
                      </div>
                      <div className="space-y-1">
                        {Object.entries(socialHandles).map(([platform, handle]) => (
                          <p key={platform} className="text-foreground">
                            <span className="text-muted-foreground capitalize">{platform}:</span> {handle}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Complaints */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Verified Complaints ({complaints.length})
              </h3>

              {complaints.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">No complaint details available for public viewing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint, index) => {
                    const complaintSeverity = severityConfig[complaint.severity];
                    
                    return (
                      <div 
                        key={complaint.id} 
                        className={`bg-card border ${complaintSeverity.borderColor} rounded-xl p-6`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm">#{index + 1}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${complaintSeverity.color}`}>
                              {complaintSeverity.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {complaint.incident_date 
                              ? new Date(complaint.incident_date).toLocaleDateString()
                              : new Date(complaint.submitted_at).toLocaleDateString()
                            }
                          </div>
                        </div>

                        <p className="text-foreground mb-4">{complaint.description}</p>

                        {complaint.amount_lost && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Amount Lost:</span>
                            <span className="font-semibold text-foreground">
                              {complaint.currency || "₦"}{complaint.amount_lost.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Report CTA */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-foreground mb-3">
            Had a bad experience with this vendor?
          </h3>
          <p className="text-muted-foreground mb-6">
            Your report could help protect others. All reporter identities are kept confidential.
          </p>
          <Button size="lg" onClick={() => navigate("/report")}>
            <FileText className="mr-2 h-5 w-5" />
            Submit a Report
          </Button>
        </div>
      </section>

      {/* Dispute Section */}
      <section className="py-8 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Are you the owner of this listing? If you believe this listing is incorrect, 
            you can submit a dispute request for review.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/dispute?vendor=${id}`)}
          >
            Dispute This Listing
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Vendor;
