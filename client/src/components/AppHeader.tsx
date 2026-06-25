import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface AppHeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
  isLoggedIn?: boolean;
  onSignUpClick?: () => void;
}

export const AppHeader = ({
  onMenuClick,
  onProfileClick,
  isLoggedIn = false,
  onSignUpClick,
}: AppHeaderProps) => {
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-10 -mx-4 flex h-20 items-center justify-between px-4 backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)]">
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-10 rounded-full p-0 hover:bg-white/5"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
        data-testid="button-menu"
      >
        <img className="h-6 w-6" alt="Menu" src="/figmaAssets/icons-ham-burger.svg" />
      </Button>

      <button
        onClick={() => navigate("/")}
        className="focus:outline-none"
        data-testid="button-logo"
      >
        <img className="h-8 w-[132.92px]" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
      </button>

      {isLoggedIn ? (
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 rounded-full p-0 hover:bg-white/5"
          aria-label="Open profile"
          onClick={onProfileClick}
          data-testid="button-profile"
        >
          <img className="h-10 w-10" alt="Profile" src="/figmaAssets/frame-1410105890.svg" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onSignUpClick}
          className="h-9 rounded-[48px] bg-th-hover px-3 text-xs font-medium text-th-text hover:bg-th-card-hover border border-th-border-strong flex items-center gap-1.5"
          data-testid="button-signup"
        >
          <img className="h-5 w-5" alt="Profile" src="/figmaAssets/frame-1410105890.svg" />
          Sign Up
        </Button>
      )}
    </header>
  );
};
