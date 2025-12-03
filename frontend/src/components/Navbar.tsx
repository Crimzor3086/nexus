import { Moon, Sun, Menu, X, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    formatAddress,
    isMetaMaskInstalled,
    balance,
    networkName,
  } = useWallet();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleWalletClick = () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Benefits", href: "#benefits" },
    { name: "About", href: "#about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl">N</span>
            </div>
            <span className="text-xl font-bold">Nexus</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <div className="hidden md:flex">
              {isConnected ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleWalletClick}
                  className="gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>{formatAddress(address || "")}</span>
                    <span className="text-xs text-muted-foreground">
                      {balance ? `${balance} ETH` : "Balance: ..."}
                    </span>
                    {networkName && (
                      <span className="text-xs text-muted-foreground">
                        {networkName}
                      </span>
                    )}
                  </div>
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="default"
                  onClick={handleWalletClick}
                  disabled={isConnecting || !isMetaMaskInstalled}
                  className="gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? "Connecting..." : isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-3">
              {isConnected ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    handleWalletClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>{formatAddress(address || "")}</span>
                    <span className="text-xs text-muted-foreground">
                      {balance ? `${balance} ETH` : "Balance: ..."}
                    </span>
                    {networkName && (
                      <span className="text-xs text-muted-foreground">
                        {networkName}
                      </span>
                    )}
                  </div>
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="default"
                  onClick={() => {
                    handleWalletClick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isConnecting || !isMetaMaskInstalled}
                  className="w-full gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? "Connecting..." : isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
