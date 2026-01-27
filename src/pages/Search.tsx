import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Shield, AlertTriangle, FileText, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Vendor = Tables<"vendors">;

const severityConfig = {
  critical: {
    label: "Critical",
    color: "bg-severity-critical text-severity-critical-foreground",
    borderColor: "border-severity-critical/30",
    bgColor: "bg-severity-critical/5",
    icon: AlertTriangle,
  },
  risky: {
    label: "Risky",
    color: "bg-severity-risky text-severity-risky-foreground",
    borderColor: "border-severity-risky/30",
    bgColor: "bg-severity-risky/5",
    icon: AlertTriangle,
  },
  unreliable: {
    label: "Unreliable",
    color: "bg-severity-unreliable text-severity-unreliable-foreground",
    borderColor: "border-severity-unreliable/30",
    bgColor: "bg-severity-unreliable/5",
    icon: AlertTriangle,
  },
};

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Search public vendors by name, phone, or bank account
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_public", true)
        .or(`name.ilike.%${query}%,phone_numbers.cs.{${query}}`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      handleSearch(searchQuery.trim());
    }
  };

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
            <span className="hidden sm:inline">Back to home</span>
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

      {/* Search Section */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by phone number, name, or bank account..."
                  className="pl-12 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Searching vendors...</p>
              </div>
            ) : hasSearched && results.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  No verified complaints found
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We haven't received any verified complaints about "{initialQuery}". 
                  This doesn't guarantee safety—always exercise caution.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    New Search
                  </Button>
                  <Button onClick={() => navigate("/report")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit a Report
                  </Button>
                </div>
              </div>
            ) : hasSearched && results.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Found {results.length} vendor{results.length !== 1 ? "s" : ""} matching "{initialQuery}"
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Click on a vendor to see detailed information
                  </p>
                </div>

                <div className="space-y-4">
                  {results.map((vendor) => {
                    const severity = vendor.highest_severity || "unreliable";
                    const config = severityConfig[severity];
                    const Icon = config.icon;

                    return (
                      <button
                        key={vendor.id}
                        onClick={() => navigate(`/vendor/${vendor.id}`)}
                        className={`w-full text-left p-6 rounded-xl border ${config.borderColor} ${config.bgColor} hover:shadow-md transition-all`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground truncate">
                                {vendor.name}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                {config.label}
                              </span>
                            </div>
                            
                            {vendor.phone_numbers && vendor.phone_numbers.length > 0 && (
                              <p className="text-sm text-muted-foreground mb-2">
                                📞 {vendor.phone_numbers.slice(0, 2).join(", ")}
                                {vendor.phone_numbers.length > 2 && ` +${vendor.phone_numbers.length - 2} more`}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {vendor.verified_complaint_count || 0} verified complaints
                              </span>
                              {vendor.first_complaint_date && (
                                <span>
                                  Since {new Date(vendor.first_complaint_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Search for a vendor
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Enter a phone number, vendor name, or bank account to check 
                  for verified misconduct reports.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Search;
