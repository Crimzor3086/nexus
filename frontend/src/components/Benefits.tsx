import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Complete control over your digital identity",
  "Secure authentication without passwords",
  "Seamless cross-platform integration",
  "Low transaction fees on Polkadot",
  "Open-source and transparent",
  "24/7 community support",
];

export const Benefits = () => {
  return (
    <section id="benefits" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-accent opacity-5 -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold">
                Why Choose
                <br />
                <span className="gradient-accent bg-clip-text text-transparent">
                  Nexus Platform
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Experience the next generation of digital identity management. 
                Built on Polkadot's robust infrastructure, Nexus offers unmatched 
                security, speed, and user control.
              </p>

              <ul className="space-y-4 pt-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-6">
                <Button variant="accent" size="lg">
                  Start Building Today
                </Button>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl bg-card border border-border space-y-2">
                <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Users
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border space-y-2">
                <div className="text-4xl font-bold text-accent">
                  99.9%
                </div>
                <div className="text-sm text-muted-foreground">
                  Uptime SLA
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border space-y-2">
                <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                  50M+
                </div>
                <div className="text-sm text-muted-foreground">
                  Transactions
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border space-y-2">
                <div className="text-4xl font-bold text-accent">
                  {"<1s"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Response
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
