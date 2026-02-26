import pageframeLogo from "@/assets/pageframe-logo.png";

const Footer = () => (
  <footer className="py-12 border-t bg-card">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <img src={pageframeLogo} alt="PageFrame" className="h-7 mb-4" />
          <p className="text-sm text-muted-foreground">
            Pixel-perfect website screenshots for every device.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
            <li><a href="/admin" className="hover:text-foreground transition-colors">Admin</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PageFrame. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
