const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-semibold text-foreground">RouteAI</span>
            </div>
            <p className="text-muted-foreground">
              Intelligent logistics planning for the future of European transportation.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Features</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">API</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Community</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Status</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors duration-300">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2024 RouteAI. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground">
              Made by <span className="font-medium text-foreground">Christian Steensbjerg Munk Jensen</span> & <span className="font-medium text-foreground">William Bille Meyling</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;