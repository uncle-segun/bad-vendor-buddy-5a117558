import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  Eye, ChevronDown, Filter, LogOut, Users, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { EvidenceViewer } from "@/components/EvidenceViewer";

type Complaint = Tables<"complaints">;
type Vendor = Tables<"vendors">;
type Evidence = Tables<"evidence">;

type ComplaintWithDetails = Complaint & { 
  vendor: Vendor;
  evidence: Evidence[];
};

const severityConfig = {
  critical: { label: "Critical", color: "bg-severity-critical text-severity-critical-foreground" },
  risky: { label: "Risky", color: "bg-severity-risky text-severity-risky-foreground" },
  unreliable: { label: "Unreliable", color: "bg-severity-unreliable text-severity-unreliable-foreground" },
};

const statusConfig = {
  submitted: { label: "Submitted", icon: Clock, color: "bg-muted text-muted-foreground" },
  under_review: { label: "Under Review", icon: AlertCircle, color: "bg-primary/20 text-primary" },
  approved: { label: "Approved", icon: CheckCircle, color: "bg-success/20 text-success" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-destructive/20 text-destructive" },
  needs_evidence: { label: "Needs Evidence", icon: AlertCircle, color: "bg-severity-risky/20 text-severity-risky" },
};

const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();

  const [complaints, setComplaints] = useState<ComplaintWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkModeratorRole = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.rpc("is_moderator_or_admin");
        
        if (error) throw error;
        
        if (!data) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to access this page.",
          });
          navigate("/dashboard");
          return;
        }

        setIsModerator(true);
      } catch (error) {
        console.error("Role check error:", error);
        navigate("/dashboard");
      }
    };

    if (user) {
      checkModeratorRole();
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!isModerator) return;

      try {
        const { data, error } = await supabase
          .from("complaints")
          .select(`
            *,
            vendor:vendors(*),
            evidence:evidence(*)
          `)
          .order("submitted_at", { ascending: false });

        if (error) throw error;
        
        const complaintsData = (data as unknown as ComplaintWithDetails[]) || [];
        setComplaints(complaintsData);

        // Calculate stats
        setStats({
          pending: complaintsData.filter(c => c.status === "submitted" || c.status === "under_review").length,
          approved: complaintsData.filter(c => c.status === "approved").length,
          rejected: complaintsData.filter(c => c.status === "rejected").length,
          total: complaintsData.length,
        });
      } catch (error) {
        console.error("Fetch complaints error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load complaints.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isModerator) {
      fetchComplaints();
    }
  }, [isModerator, toast]);

  const filteredComplaints = complaints.filter(complaint => {
    if (statusFilter !== "all" && complaint.status !== statusFilter) return false;
    if (severityFilter !== "all" && complaint.severity !== severityFilter) return false;
    return true;
  });

  const handleReview = (complaint: ComplaintWithDetails) => {
    setSelectedComplaint(complaint);
    setReviewNotes(complaint.review_notes || "");
  };

  const handleUpdateStatus = async (newStatus: Complaint["status"]) => {
    if (!selectedComplaint || !user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          status: newStatus,
          review_notes: reviewNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      // Update local state
      setComplaints(prev => prev.map(c => 
        c.id === selectedComplaint.id 
          ? { ...c, status: newStatus, review_notes: reviewNotes }
          : c
      ));

      toast({
        title: "Status updated",
        description: `Complaint has been ${newStatus === "approved" ? "approved" : newStatus === "rejected" ? "rejected" : "updated"}.`,
      });

      setSelectedComplaint(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Update error:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update the complaint status.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoading || !isModerator) {
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
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">BadVendor</span>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full ml-2">
              Moderator
            </span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              My Reports
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-severity-risky/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-severity-risky" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="needs_evidence">Needs Evidence</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="risky">Risky</SelectItem>
              <SelectItem value="unreliable">Unreliable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complaints Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Severity</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Submitted</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Evidence</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No complaints found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((complaint) => {
                    const status = statusConfig[complaint.status];
                    const severity = severityConfig[complaint.severity];
                    const StatusIcon = status.icon;

                    return (
                      <tr key={complaint.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-medium text-foreground">{complaint.vendor?.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {complaint.description.slice(0, 50)}...
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${severity.color}`}>
                            {severity.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {new Date(complaint.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-muted-foreground">
                            {complaint.evidence?.length || 0} files
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => handleReview(complaint)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <DialogTitle>Review Complaint</DialogTitle>
                <DialogDescription>
                  Review the details and evidence, then update the status.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Vendor Info */}
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Vendor Information</h4>
                  <p className="text-foreground font-semibold">{selectedComplaint.vendor?.name}</p>
                  {selectedComplaint.vendor?.phone_numbers && (
                    <p className="text-sm text-muted-foreground">
                      📞 {selectedComplaint.vendor.phone_numbers.join(", ")}
                    </p>
                  )}
                </div>

                {/* Severity & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Severity</span>
                    <p className="font-medium text-foreground capitalize">{selectedComplaint.severity}</p>
                  </div>
                  {selectedComplaint.amount_lost && (
                    <div>
                      <span className="text-sm text-muted-foreground">Amount Lost</span>
                      <p className="font-medium text-foreground">
                        ₦{selectedComplaint.amount_lost.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-foreground mt-1">{selectedComplaint.description}</p>
                </div>

                {/* Evidence - Using secure signed URLs */}
                {selectedComplaint.evidence && selectedComplaint.evidence.length > 0 && (
                  <EvidenceViewer evidence={selectedComplaint.evidence} />
                )}

                {/* Review Notes */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Review Notes</label>
                  <Textarea
                    placeholder="Add notes about your decision (visible to reporter)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("needs_evidence")}
                  disabled={isSubmitting}
                >
                  Request Evidence
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={isSubmitting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={isSubmitting}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModeratorDashboard;
