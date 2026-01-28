import { Search, FileText, Users, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import AppHeader from "@/components/AppHeader";
import { Testimonials } from "@/components/ui/twitter-testimonial-cards";
import { GlowCard } from "@/components/ui/spotlight-card";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero Section with animated background */}
      <HeroSection />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How BadVendor Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our verification process ensures only legitimate complaints are published, 
              protecting both consumers and honest vendors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">1. Search First</h3>
              <p className="text-muted-foreground">
                Before any transaction, search the vendor's phone number, name, or bank account 
                to check for verified complaints.
              </p>
            </div>

            <div className="text-center p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 bg-severity-risky/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-severity-risky" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">2. Report Fraud</h3>
              <p className="text-muted-foreground">
                If you've been defrauded, submit a report with evidence. Our team verifies 
                every complaint before publication.
              </p>
            </div>

            <div className="text-center p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">3. Protect Others</h3>
              <p className="text-muted-foreground">
                Once 3+ complaints are verified, the vendor is listed publicly, helping 
                other Nigerians avoid the same fate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Severity Levels */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Understanding Severity Levels
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Vendors are categorized based on the nature and severity of verified complaints.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <GlowCard glowColor="red" customSize className="h-auto aspect-auto">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-severity-critical rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-severity-critical-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Critical</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Severe cases involving significant financial loss, identity theft, or 
                  criminal activity. High risk of harm.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Money taken, no goods/services</li>
                  <li>• Identity theft or fraud</li>
                  <li>• Fake products with safety risks</li>
                </ul>
              </div>
            </GlowCard>

            <GlowCard glowColor="orange" customSize className="h-auto aspect-auto">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-severity-risky rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-severity-risky-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Risky</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Serious issues with partial delivery or significant deception. 
                  Exercise caution if transacting.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Partial delivery of goods</li>
                  <li>• Significantly misrepresented items</li>
                  <li>• Unresponsive after payment</li>
                </ul>
              </div>
            </GlowCard>

            <GlowCard glowColor="blue" customSize className="h-auto aspect-auto">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-severity-unreliable rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-severity-unreliable-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Unreliable</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Pattern of poor service or minor issues. May be acceptable for 
                  low-risk transactions.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Excessive delays</li>
                  <li>• Minor quality issues</li>
                  <li>• Poor communication</li>
                </ul>
              </div>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-card border-y border-border overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Real Stories from Real Nigerians
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from people who've been affected by vendor fraud—and how BadVendor is helping protect others.
            </p>
          </div>
          <div className="flex justify-center">
            <Testimonials />
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Verified Reports</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">850+</div>
              <div className="text-muted-foreground">Listed Vendors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">₦45M+</div>
              <div className="text-muted-foreground">Fraud Documented</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15K+</div>
              <div className="text-muted-foreground">Monthly Searches</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Been Defrauded? Report It.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Your report could save someone else from the same experience. 
              All reports are verified and reporter identities are always protected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/report")}>
                <FileText className="mr-2 h-5 w-5" />
                Submit a Report
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6" />
                <span className="text-lg font-bold">BadVendor</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Nigeria's verified misconduct registry. Protecting consumers 
                through transparency and accountability.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/search" className="hover:text-background transition-colors">Search Vendors</a></li>
                <li><a href="/report" className="hover:text-background transition-colors">Submit Report</a></li>
                <li><a href="/auth" className="hover:text-background transition-colors">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-background transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-background transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Report Guidelines</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-muted-foreground/20 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} BadVendor. All rights reserved. Built for Nigeria 🇳🇬
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
