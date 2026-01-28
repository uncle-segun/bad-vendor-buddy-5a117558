import logoIcon from "@/assets/logo-icon.png";

const Footer = () => {
  return (
    <footer id="about" className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoIcon} alt="BadVendors" className="h-10 w-10 rounded" />
              <span className="text-lg font-bold">BadVendors</span>
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
              <li><a href="/#how-it-works" className="hover:text-background transition-colors">How It Works</a></li>
              <li><a href="/dispute" className="hover:text-background transition-colors">Dispute a Listing</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/terms" className="hover:text-background transition-colors">Terms of Service</a></li>
              <li><a href="/dispute-terms" className="hover:text-background transition-colors">Dispute Terms</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-muted-foreground/20 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BadVendor. All rights reserved. Built for Nigeria 🇳🇬
        </div>
      </div>
    </footer>
  );
};

export default Footer;
