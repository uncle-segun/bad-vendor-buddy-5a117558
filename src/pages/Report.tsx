import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, ArrowLeft, ArrowRight, AlertTriangle, Check, 
  Phone, Mail, Building, User, Calendar, FileText, 
  Upload, X, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phoneNumbers: z.string().optional(),
  emailAddresses: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialFacebook: z.string().optional(),
});

const incidentSchema = z.object({
  description: z.string().trim().min(50, "Please provide at least 50 characters").max(2000),
  incidentDate: z.string().optional(),
  amountLost: z.string().optional(),
  currentStatus: z.string().optional(),
});

type Step = 1 | 2 | 3 | 4 | 5;

const severityOptions = [
  {
    value: "critical",
    label: "Critical",
    description: "Money taken with no goods/services, identity theft, fake products with safety risks",
    color: "border-severity-critical/50 bg-severity-critical/5",
    selectedColor: "border-severity-critical bg-severity-critical/20",
  },
  {
    value: "risky",
    label: "Risky",
    description: "Partial delivery, significantly misrepresented items, unresponsive after payment",
    color: "border-severity-risky/50 bg-severity-risky/5",
    selectedColor: "border-severity-risky bg-severity-risky/20",
  },
  {
    value: "unreliable",
    label: "Unreliable",
    description: "Excessive delays, minor quality issues, poor communication",
    color: "border-severity-unreliable/50 bg-severity-unreliable/5",
    selectedColor: "border-severity-unreliable bg-severity-unreliable/20",
  },
] as const;

interface EvidenceFile {
  file: File;
  preview?: string;
}

const Report = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Vendor Info
  const [vendorName, setVendorName] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [emailAddresses, setEmailAddresses] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");

  // Step 2: Severity
  const [severity, setSeverity] = useState<"critical" | "risky" | "unreliable" | "">("");

  // Step 3: Incident Details
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [amountLost, setAmountLost] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");

  // Step 4: Evidence
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  // Step 5: Confirmation
  const [confirmTruthful, setConfirmTruthful] = useState(false);
  const [confirmUnderstand, setConfirmUnderstand] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a report.",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

  const validateStep = (): boolean => {
    setErrors({});
    
    if (step === 1) {
      const result = vendorSchema.safeParse({
        name: vendorName,
        phoneNumbers,
        emailAddresses,
        bankName,
        accountNumber,
        socialInstagram,
        socialTwitter,
        socialFacebook,
      });
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      
      // Require at least one identifier
      if (!phoneNumbers.trim() && !emailAddresses.trim() && !accountNumber.trim()) {
        setErrors({ general: "Please provide at least one identifier (phone, email, or bank account)" });
        return false;
      }
    }

    if (step === 2 && !severity) {
      setErrors({ severity: "Please select a severity level" });
      return false;
    }

    if (step === 3) {
      const result = incidentSchema.safeParse({ description, incidentDate, amountLost, currentStatus });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    }

    if (step === 5 && (!confirmTruthful || !confirmUnderstand)) {
      setErrors({ confirm: "Please confirm both checkboxes to submit" });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep() && step < 5) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: EvidenceFile[] = [];
    
    for (let i = 0; i < files.length && evidenceFiles.length + newFiles.length < 20; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
        });
        continue;
      }
      
      const evidenceFile: EvidenceFile = { file };
      if (file.type.startsWith("image/")) {
        evidenceFile.preview = URL.createObjectURL(file);
      }
      newFiles.push(evidenceFile);
    }

    setEvidenceFiles([...evidenceFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...evidenceFiles];
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    setEvidenceFiles(newFiles);
  };

  const handleSubmit = async () => {
    if (!validateStep() || !user || !severity) return;

    setIsSubmitting(true);

    try {
      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Could not find user profile");
      }

      // Create or find the vendor
      const phoneArray = phoneNumbers.split(",").map(p => p.trim()).filter(Boolean);
      const emailArray = emailAddresses.split(",").map(e => e.trim()).filter(Boolean);
      const socialHandles: Record<string, string> = {};
      if (socialInstagram) socialHandles.instagram = socialInstagram;
      if (socialTwitter) socialHandles.twitter = socialTwitter;
      if (socialFacebook) socialHandles.facebook = socialFacebook;
      
      const bankAccounts = bankName && accountNumber ? [{ bank: bankName, account_number: accountNumber }] : null;

      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          name: vendorName.trim(),
          phone_numbers: phoneArray.length > 0 ? phoneArray : null,
          email_addresses: emailArray.length > 0 ? emailArray : null,
          bank_accounts: bankAccounts,
          social_handles: Object.keys(socialHandles).length > 0 ? socialHandles : null,
        })
        .select()
        .single();

      if (vendorError) throw vendorError;

      // Create the complaint
      const { data: complaint, error: complaintError } = await supabase
        .from("complaints")
        .insert({
          vendor_id: vendor.id,
          reporter_id: profile.id,
          severity: severity,
          description: description.trim(),
          incident_date: incidentDate || null,
          amount_lost: amountLost ? parseFloat(amountLost) : null,
          currency: "NGN",
          current_status: currentStatus || null,
        })
        .select()
        .single();

      if (complaintError) throw complaintError;

      // Upload evidence files
      for (const evidenceFile of evidenceFiles) {
        const fileExt = evidenceFile.file.name.split(".").pop();
        const fileName = `${complaint.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("evidence")
          .upload(fileName, evidenceFile.file);

        if (uploadError) {
          console.error("Evidence upload error:", uploadError);
          continue;
        }

        // Store only the file path, not a public URL
        // Signed URLs will be generated on-demand when viewing evidence
        await supabase.from("evidence").insert({
          complaint_id: complaint.id,
          file_url: fileName, // Store the path, not the public URL
          file_name: evidenceFile.file.name,
          file_type: evidenceFile.file.type,
          file_size: evidenceFile.file.size,
        });
      }

      toast({
        title: "Report submitted!",
        description: "Your report has been submitted for verification. We'll notify you of updates.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting your report. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps = [
    { num: 1, label: "Vendor Info" },
    { num: 2, label: "Category" },
    { num: 3, label: "Details" },
    { num: 4, label: "Evidence" },
    { num: 5, label: "Submit" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Report a Vendor</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2 overflow-x-auto">
            {steps.map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                    s.num === step 
                      ? "bg-primary text-primary-foreground" 
                      : s.num < step 
                        ? "bg-success/20 text-success" 
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                    {s.num < step ? <Check className="h-4 w-4" /> : s.num}
                  </span>
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${s.num < step ? "bg-success" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Vendor Info */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Vendor Information</h2>
                <p className="text-muted-foreground">
                  Provide as much information as you have about the vendor.
                </p>
              </div>

              {errors.general && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {errors.general}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="vendorName"
                      placeholder="Business or individual name"
                      className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="phoneNumbers">Phone Numbers (comma-separated)</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phoneNumbers"
                      placeholder="08012345678, 09087654321"
                      className="pl-10"
                      value={phoneNumbers}
                      onChange={(e) => setPhoneNumbers(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emailAddresses">Email Addresses (comma-separated)</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="emailAddresses"
                      placeholder="vendor@example.com"
                      className="pl-10"
                      value={emailAddresses}
                      onChange={(e) => setEmailAddresses(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <div className="relative mt-1">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="bankName"
                        placeholder="e.g., GTBank"
                        className="pl-10"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="0123456789"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Social Media Handles (optional)</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <Input
                      placeholder="Instagram"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                    />
                    <Input
                      placeholder="Twitter/X"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                    />
                    <Input
                      placeholder="Facebook"
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Severity Selection */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Severity</h2>
                <p className="text-muted-foreground">
                  Choose the category that best describes your experience.
                </p>
              </div>

              {errors.severity && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {errors.severity}
                </div>
              )}

              <div className="space-y-4">
                {severityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSeverity(option.value)}
                    className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                      severity === option.value ? option.selectedColor : option.color
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        severity === option.value ? "border-current bg-current" : "border-current"
                      }`}>
                        {severity === option.value && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{option.label}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Incident Details */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Incident Details</h2>
                <p className="text-muted-foreground">
                  Describe what happened. Be specific and factual.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what happened, including what was promised vs. what you received..."
                    className={`mt-1 min-h-[150px] ${errors.description ? "border-destructive" : ""}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description ? (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-sm text-muted-foreground">{description.length}/2000</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incidentDate">Incident Date</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="incidentDate"
                        type="date"
                        className="pl-10"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="amountLost">Amount Lost (₦)</Label>
                    <Input
                      id="amountLost"
                      type="number"
                      placeholder="50000"
                      value={amountLost}
                      onChange={(e) => setAmountLost(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentStatus">Current Status (optional)</Label>
                  <Input
                    id="currentStatus"
                    placeholder="e.g., Reported to police, disputed with bank, no response"
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Evidence */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Upload Evidence</h2>
                <p className="text-muted-foreground">
                  Screenshots, receipts, chat logs, or any documentation supporting your report.
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">
                  Drag files here or click to upload
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Images and PDFs up to 20MB each (max 20 files)
                </p>
                <input
                  type="file"
                  id="evidence"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
                <Button variant="outline" onClick={() => document.getElementById("evidence")?.click()}>
                  Select Files
                </Button>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="space-y-3">
                  <Label>Uploaded Files ({evidenceFiles.length}/20)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {evidenceFiles.map((ef, index) => (
                      <div key={index} className="relative bg-muted rounded-lg p-3">
                        {ef.preview ? (
                          <img
                            src={ef.preview}
                            alt={ef.file.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="w-full h-24 bg-card rounded flex items-center justify-center mb-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs text-foreground truncate">{ef.file.name}</p>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Review & Submit</h2>
                <p className="text-muted-foreground">
                  Please review your report before submitting.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Vendor</span>
                  <p className="text-foreground font-medium">{vendorName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Severity</span>
                  <p className="text-foreground font-medium capitalize">{severity}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-foreground">{description.slice(0, 200)}...</p>
                </div>
                {amountLost && (
                  <div>
                    <span className="text-sm text-muted-foreground">Amount Lost</span>
                    <p className="text-foreground font-medium">₦{parseInt(amountLost).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Evidence Files</span>
                  <p className="text-foreground">{evidenceFiles.length} file(s) attached</p>
                </div>
              </div>

              {errors.confirm && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {errors.confirm}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="truthful"
                    checked={confirmTruthful}
                    onCheckedChange={(checked) => setConfirmTruthful(checked as boolean)}
                  />
                  <Label htmlFor="truthful" className="text-sm leading-relaxed cursor-pointer">
                    I confirm that the information provided is truthful and accurate to the best of my knowledge. 
                    I understand that submitting false reports may result in account suspension.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="understand"
                    checked={confirmUnderstand}
                    onCheckedChange={(checked) => setConfirmUnderstand(checked as boolean)}
                  />
                  <Label htmlFor="understand" className="text-sm leading-relaxed cursor-pointer">
                    I understand that my report will be verified before publication, and my identity will be 
                    kept confidential.
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < 5 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Report;
