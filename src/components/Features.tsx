import { Brain, Route, AlertTriangle, BarChart3, Clock, Shield } from "lucide-react";
import aiOptimizationImage from "@/assets/ai-optimization.png";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Optimization",
      description: "Advanced algorithms analyze thousands of variables to find the most efficient routes in real-time."
    },
    {
      icon: Route,
      title: "Multi-Stop Planning",
      description: "Connect factories, warehouses, and distribution centers across Europe with optimal path planning."
    },
    {
      icon: AlertTriangle,
      title: "Real-Time Adaptation",
      description: "Ask 'what if' questions and get instant route recalculations for road closures or delays."
    },
    {
      icon: BarChart3,
      title: "Cost Analysis",
      description: "Track fuel costs, tolls, and bridge fees with detailed cost breakdowns for every route."
    },
    {
      icon: Clock,
      title: "Time Optimization",
      description: "Balance speed and cost with intelligent scheduling that considers traffic patterns."
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Identify potential disruptions and have backup routes ready before problems occur."
    }
  ];

  return (
    <section id="features" className="py-20 px-6 bg-subtle-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Revolutionize Your
            <span className="block bg-hero-gradient bg-clip-text text-transparent">
              Logistics Operations
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI understands the complexity of European logistics and provides intelligent solutions 
            that adapt to changing conditions in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <div className="space-y-8">
            <div className="bg-background rounded-2xl p-8 shadow-medium">
              <img 
                src={aiOptimizationImage} 
                alt="AI optimization visualization"
                className="w-full h-auto rounded-lg mb-6"
              />
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Intelligent Decision Making
              </h3>
              <p className="text-muted-foreground">
                Our AI processes real-time traffic data, weather conditions, and cost factors 
                to continuously optimize your routes for maximum efficiency.
              </p>
            </div>
          </div>
          
          <div className="grid gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-background rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;