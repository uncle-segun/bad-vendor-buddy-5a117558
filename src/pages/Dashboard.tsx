import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import Footer from "@/components/Footer";

type Complaint = Tables<"complaints">;
type Vendor = Tables<"vendors">;

type ComplaintWithVendor = Complaint & { vendor: Vendor };

const statusConfig = {
  submitted: {
    label: "Submitted",
    description: "Your report has been received and is waiting for review.",
    icon: Clock,
    color: "bg-muted text-muted-foreground",
  },
  under_review: {
    label: "Under Review",
    description: "A moderator is currently reviewing your report.",
    icon: AlertCircle,
    color: "bg-primary/20 text-primary",
  },
  approved: {
    label: "Approved",
    description: "Your report has been verified and published.",
    icon: CheckCircle,
    color: "bg-success/20 text-success",
  },
  rejected: {
    label: "Rejected",
    description: "Your report did not meet our verification criteria.",
    icon: XCircle,
    color: "bg-destructive/20 text-destructive",
  },
  needs_evidence: {
    label: "Needs Evidence",
    description: "Please provide additional evidence to support your report.",
    icon: AlertCircle,
    color: "bg-severity-risky/20 text-severity-risky",
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();

  const [complaints, setComplaints] = useState<ComplaintWithVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!user) return;

      try {
        // First get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile) {
          console.error("Profile error:", profileError);
          return;
        }

        // Then fetch complaints for this profile
        const { data, error } = await supabase
          .from("complaints")
          .select(`
            *,
            vendor:vendors(*)
          `)
          .eq("reporter_id", profile.id)
          .order("submitted_at", { ascending: false });

        if (error) throw error;
        setComplaints((data as unknown as ComplaintWithVendor[]) || []);
      } catch (error) {
        console.error("Fetch complaints error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your reports.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchComplaints();
    }
  }, [user, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">BadVendor</span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">My Reports</h1>
              <p className="text-muted-foreground">Track the status of your submitted reports.</p>
            </div>
            <Button onClick={() => navigate("/report")}>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </div>

          {/* Reports List */}
          {complaints.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-3">No reports yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't submitted any reports. Help protect others by reporting fraudulent vendors.
              </p>
              <Button onClick={() => navigate("/report")}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => {
                const status = statusConfig[complaint.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={complaint.id}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {complaint.vendor?.name || "Unknown Vendor"}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {complaint.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Submitted: {new Date(complaint.submitted_at).toLocaleDateString()}
                          </span>
                          {complaint.amount_lost && (
                            <span>
                              Amount: ₦{complaint.amount_lost.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-3 italic">
                          {status.description}
                        </p>
                      </div>

                      <div className={`w-12 h-12 rounded-xl ${status.color} flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                    </div>

                    {complaint.review_notes && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-1">Moderator Notes:</p>
                        <p className="text-sm text-muted-foreground">{complaint.review_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
