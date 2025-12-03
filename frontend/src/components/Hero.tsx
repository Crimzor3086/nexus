import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-nexus.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-subtle -z-10" />
      
      {/* Hero image overlay */}
      <div 
        className="absolute inset-0 opacity-10 dark:opacity-5 -z-10"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Nexus Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/assets/nexus-logo.svg" 
              alt="Nexus Project Logo" 
              className="h-32 w-32 sm:h-40 sm:w-40 animate-fade-in"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Built on Polkadot
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Your Identity,
            <br />
            <span className="gradient-primary bg-clip-text text-transparent">
              Your Control
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A modern decentralized identity and utility platform that puts you in control. 
            Secure, scalable, and built for the future of Web3.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/dashboard">
              <Button variant="hero" size="lg" className="group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <Shield className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Secure</h3>
              <p className="text-sm text-muted-foreground text-center">
                Enterprise-grade security powered by blockchain
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <Zap className="h-8 w-8 text-accent" />
              <h3 className="font-semibold">Fast</h3>
              <p className="text-sm text-muted-foreground text-center">
                Lightning-fast transactions on Polkadot
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="h-8 w-8 rounded-lg gradient-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold">∞</span>
              </div>
              <h3 className="font-semibold">Scalable</h3>
              <p className="text-sm text-muted-foreground text-center">
                Built to grow with your needs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
