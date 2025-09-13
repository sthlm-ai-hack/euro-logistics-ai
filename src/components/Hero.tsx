import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, MapPin } from "lucide-react";
import routeMapImage from "@/assets/route-map.png";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Intelligent
                <span className="block bg-hero-gradient bg-clip-text text-transparent">
                  Route Planning
                </span>
                for Europe
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                AI-powered logistics optimization that adapts to real-time changes. 
                Plan optimal truck routes, manage costs, and respond instantly to disruptions.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group">
                Start Planning Routes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button variant="minimal" size="lg">
                View Demo
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Routes Optimized</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">50+</div>
                  <div className="text-sm text-muted-foreground">European Cities</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-large bg-subtle-gradient p-8">
              <img 
                src={routeMapImage} 
                alt="European logistics route optimization map"
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl"></div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-hero-gradient rounded-full opacity-10 blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;