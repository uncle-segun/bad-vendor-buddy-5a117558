import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Search, User, LogOut, FileText, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">BadVendor</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          
          {loading ? (
            <div className="w-24 h-10 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-32 truncate">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  My Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/report")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
          
          <Button onClick={() => navigate("/report")}>
            Report a Vendor
          </Button>
        </nav>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <a 
            href="#how-it-works" 
            className="block text-muted-foreground hover:text-foreground transition-colors py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </a>
          <a 
            href="#about" 
            className="block text-muted-foreground hover:text-foreground transition-colors py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </a>
          
          {user ? (
            <>
              <div className="flex items-center gap-2 py-2 text-foreground font-medium">
                <User className="h-4 w-4" />
                {displayName}
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                My Reports
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive" 
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}
            >
              Sign In
            </Button>
          )}
          
          <Button 
            className="w-full" 
            onClick={() => { navigate("/report"); setMobileMenuOpen(false); }}
          >
            Report a Vendor
          </Button>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
