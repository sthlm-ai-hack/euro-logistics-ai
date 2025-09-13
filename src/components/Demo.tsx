import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Play } from "lucide-react";

const Demo = () => {
  const scenarios = [
    {
      question: "What if the A1 highway between Hamburg and Berlin is closed?",
      result: "Route recalculated via A24 → +45 minutes, +€120 fuel costs. Alternative via A39 → +20 minutes, +€85."
    },
    {
      question: "How does adding a stop in Prague affect our Munich to Warsaw route?",
      result: "Optimal path: Munich → Prague → Warsaw. Total time: +3.2 hours. Cost increase: +€240. Recommended departure: 2 hours earlier."
    },
    {
      question: "What's the cheapest route from Rotterdam to Milan avoiding tolls?",
      result: "Route via Germany saves €180 in tolls but adds 4 hours. Recommended: Mixed route saving €95 with only +1.5 hours."
    }
  ];

  return (
    <section id="demo" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            See RouteAI in
            <span className="block bg-hero-gradient bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ask questions in natural language and get instant, intelligent responses 
            that help you make better logistics decisions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="bg-background rounded-2xl p-8 shadow-large border border-border">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-hero-gradient rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Interactive AI Assistant
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-foreground font-medium">Try asking:</p>
                </div>
                
                {scenarios.map((scenario, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary-foreground text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-foreground font-medium">"{scenario.question}"</p>
                        <p className="text-sm text-muted-foreground">{scenario.result}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="hero" className="w-full mt-6 group">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Try Live Demo
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="p-6 shadow-medium">
              <h4 className="text-lg font-semibold text-foreground mb-4">Real-Time Updates</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Traffic Data</span>
                  <span className="text-green-600 font-medium">Live</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weather Conditions</span>
                  <span className="text-green-600 font-medium">Updated</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fuel Prices</span>
                  <span className="text-green-600 font-medium">Current</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Road Closures</span>
                  <span className="text-green-600 font-medium">Monitoring</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 shadow-medium">
              <h4 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Route Efficiency</span>
                    <span className="text-foreground font-medium">94%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Cost Savings</span>
                    <span className="text-foreground font-medium">€12,500/month</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Time Optimization</span>
                    <span className="text-foreground font-medium">18% faster</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo;