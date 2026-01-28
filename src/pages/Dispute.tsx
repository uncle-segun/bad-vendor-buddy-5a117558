import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Shield, ArrowLeft, Upload, X, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

interface EvidenceFile {
  file: File;
  description: string;
  preview?: string;
}

const ID_DOCUMENT_TYPES = [
  { value: "national_id", label: "National ID Card (NIN)" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "international_passport", label: "International Passport" },
  { value: "voters_card", label: "Voter's Card" },
];

const Dispute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get("vendor");
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idDocumentType, setIdDocumentType] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "ID document must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setIdDocument(file);
    }
  };

  const handleEvidenceAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: EvidenceFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 20MB`,
          variant: "destructive",
        });
        continue;
      }
      if (evidenceFiles.length + newFiles.length >= 10) {
        toast({
          title: "Maximum files reached",
          description: "You can upload up to 10 evidence files",
          variant: "destructive",
        });
        break;
      }
      newFiles.push({ file, description: "" });
    }
    setEvidenceFiles([...evidenceFiles, ...newFiles]);
    e.target.value = "";
  };

  const removeEvidenceFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const updateEvidenceDescription = (index: number, description: string) => {
    const updated = [...evidenceFiles];
    updated[index].description = description;
    setEvidenceFiles(updated);
  };

  const uploadToR2 = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("r2-upload", {
      body: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        bucket: "temp",
        path,
      },
    });

    if (error || !data?.signedUrl) {
      throw new Error("Failed to get upload URL");
    }

    const uploadResponse = await fetch(data.signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    return data.fileUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorId) {
      toast({
        title: "Invalid request",
        description: "Please access this page from a vendor's profile",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms required",
        description: "You must accept the terms and conditions to proceed",
        variant: "destructive",
      });
      return;
    }

    if (!idDocument) {
      toast({
        title: "ID document required",
        description: "Please upload a valid ID document",
        variant: "destructive",
      });
      return;
    }

    if (reason.length < 50) {
      toast({
        title: "Reason too short",
        description: "Please provide a detailed explanation (at least 50 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload ID document
      const idDocPath = `disputes/${crypto.randomUUID()}/${idDocument.name}`;
      const idDocUrl = await uploadToR2(idDocument, idDocPath);

      // Create dispute request
      const { data: dispute, error: disputeError } = await supabase
        .from("dispute_requests")
        .insert({
          vendor_id: vendorId,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          id_document_url: idDocUrl,
          id_document_type: idDocumentType,
          reason: reason.trim(),
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (disputeError) throw disputeError;

      // Upload evidence files
      for (const evidence of evidenceFiles) {
        const evidencePath = `disputes/${dispute.id}/${evidence.file.name}`;
        const evidenceUrl = await uploadToR2(evidence.file, evidencePath);

        await supabase.from("dispute_evidence").insert({
          dispute_id: dispute.id,
          file_url: evidenceUrl,
          file_name: evidence.file.name,
          file_type: evidence.file.type,
          file_size: evidence.file.size,
          description: evidence.description || null,
        });
      }

      setIsSuccess(true);
      toast({
        title: "Request submitted",
        description: "Your dispute request has been submitted for review",
      });
    } catch (error) {
      console.error("Dispute submission error:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to home</span>
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">BadVendor</span>
            </div>
            <div className="w-24" />
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Request Submitted</h1>
            <p className="text-muted-foreground mb-8">
              Your dispute request has been submitted successfully. Our team will review your submission
              and contact you via email within 7-14 business days.
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </main>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to home</span>
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">BadVendor</span>
            </div>
            <div className="w-24" />
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Invalid Request</h1>
            <p className="text-muted-foreground mb-8">
              To dispute a listing, please access this page from the vendor's profile page.
              Search for the vendor and click "Dispute This Listing" button.
            </p>
            <Button onClick={() => navigate("/search")}>Search Vendors</Button>
          </div>
        </main>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">BadVendor</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dispute Listing Request</h1>
            <p className="text-muted-foreground">
              Submit a request to have your listing reviewed for removal
            </p>
          </div>

          <Card className="border-warning/30 bg-warning/5 mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Important Notice</p>
                  <p className="text-muted-foreground">
                    This form is for individuals who believe they have been wrongly listed.
                    All information provided will be verified. Submitting false information
                    may result in legal action.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>
                  Provide your contact details for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Legal Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name as it appears on your ID"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+234 XXX XXX XXXX"
                      required
                      minLength={10}
                      maxLength={20}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identity Verification</CardTitle>
                <CardDescription>
                  Upload a valid government-issued ID to verify your identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="idType">ID Document Type *</Label>
                  <Select value={idDocumentType} onValueChange={setIdDocumentType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="idDocument">Upload ID Document *</Label>
                  <div className="mt-2">
                    {idDocument ? (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="flex-1 truncate text-sm">{idDocument.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIdDocument(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload (max 10MB)
                        </span>
                        <input
                          id="idDocument"
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={handleIdDocumentChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dispute Details</CardTitle>
                <CardDescription>
                  Explain why you believe this listing should be removed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reason">Detailed Explanation *</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a detailed explanation of why you believe this listing is incorrect or should be removed. Include any relevant circumstances, dates, or clarifications..."
                    rows={6}
                    required
                    minLength={50}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {reason.length}/5000 characters (minimum 50)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supporting Evidence</CardTitle>
                <CardDescription>
                  Upload any documents that support your dispute (optional, max 10 files)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {evidenceFiles.length > 0 && (
                  <div className="space-y-3">
                    {evidenceFiles.map((evidence, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="flex-1 truncate text-sm">{evidence.file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvidenceFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Description (optional)"
                          value={evidence.description}
                          onChange={(e) => updateEvidenceDescription(index, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {evidenceFiles.length < 10 && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">
                      Add evidence files (max 20MB each)
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      multiple
                      onChange={handleEvidenceAdd}
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    I confirm that all information provided is true and accurate. I understand that
                    submitting false information may result in legal action. I have read and agree
                    to the{" "}
                    <Link to="/dispute-terms" className="text-primary hover:underline" target="_blank">
                      Dispute Terms and Conditions
                    </Link>
                    .
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || !termsAccepted}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Dispute Request"
              )}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dispute;
