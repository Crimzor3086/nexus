import { Key, Database, Wallet, Users, Lock, Globe } from "lucide-react";

const features = [
  {
    icon: Key,
    title: "Decentralized Identity",
    description: "Own and control your digital identity across platforms without relying on centralized authorities.",
  },
  {
    icon: Database,
    title: "Data Sovereignty",
    description: "Your data stays yours. Choose what to share, when to share, and with whom.",
  },
  {
    icon: Wallet,
    title: "Integrated Wallet",
    description: "Seamlessly manage your assets and credentials in one secure, user-friendly interface.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by the community, for the community. Participate in governance and shape the future.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Zero-knowledge proofs and advanced cryptography ensure your privacy is never compromised.",
  },
  {
    icon: Globe,
    title: "Interoperable",
    description: "Connect with multiple blockchains and platforms through Polkadot's cross-chain technology.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Built for the Future
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need for a secure, decentralized digital identity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-smooth hover:shadow-lg"
            >
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-smooth">
                <feature.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
