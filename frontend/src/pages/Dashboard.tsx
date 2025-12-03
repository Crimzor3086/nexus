import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, Shield, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const features = [
    {
      icon: Wallet,
      title: "Connect Wallet",
      description: "Link your Web3 wallet to start",
      action: "Connect Now",
    },
    {
      icon: Shield,
      title: "Verify Identity",
      description: "Complete your identity verification",
      action: "Verify",
    },
    {
      icon: Zap,
      title: "Make Payments",
      description: "Send and receive utility payments",
      action: "Start Paying",
    },
    {
      icon: TrendingUp,
      title: "Build Reputation",
      description: "Earn reputation points",
      action: "Learn More",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold">Nexus Dashboard</h1>
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 max-w-6xl">
        <div className="space-y-12">
          {/* Welcome Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Welcome to Nexus! 👋
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              You're now part of the decentralized identity revolution. Let's get you started with these essential steps.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl bg-card/50 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="mt-2 group-hover:translate-x-1 transition-transform"
                      >
                        {feature.action} →
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-card/50 border border-border text-center space-y-2">
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                10K+
              </div>
              <p className="text-muted-foreground">Active Users</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 border border-border text-center space-y-2">
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                $5M+
              </div>
              <p className="text-muted-foreground">Total Volume</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 border border-border text-center space-y-2">
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                99.9%
              </div>
              <p className="text-muted-foreground">Uptime</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-4 mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20">
            <h3 className="text-2xl font-bold">Ready to start?</h3>
            <p className="text-muted-foreground mb-6">Connect your wallet and verify your identity to begin</p>
            <Button variant="hero" size="lg">
              Connect Wallet Now
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-muted-foreground text-sm">
            <p>© 2025 Nexus Project. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
