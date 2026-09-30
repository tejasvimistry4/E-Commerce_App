import React, { useEffect, useRef, useState } from "react";
import { GOOGLE_CONFIG } from "../../config/google";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
            }
          ) => void;
          prompt: (notification?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  mode?: "signin" | "signup";
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
  label?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = "signin",
  onSuccess,
  onError,
  disabled = false,
  label,
}) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const clientId = GOOGLE_CONFIG.clientId;

  // 1. Dynamically Load Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsScriptLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      onError?.("Failed to load Google Sign-In SDK. Please check your internet connection.");
    };

    document.head.appendChild(script);
  }, [onError]);

  // 2. Initialize Google ID Client when script and Client ID are available
  useEffect(() => {
    if (!isScriptLoaded || !window.google?.accounts?.id || !clientId) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) {
            onError?.("Google authentication was cancelled or failed to return credentials.");
            return;
          }
          try {
            setIsAuthenticating(true);
            await onSuccess(response.credential);
          } catch (err: any) {
            onError?.(err?.message || "Google authentication failed.");
          } finally {
            setIsAuthenticating(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render official Google button into overlay container
      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
        });
      }
    } catch (err: any) {
      console.warn("Failed to initialize Google Sign-In:", err);
    }
  }, [isScriptLoaded, clientId, mode, onSuccess, onError]);

  // 3. Fallback Click Handler if overlay is not active
  const handleCustomButtonClick = () => {
    if (!clientId) {
      onError?.("Google Client ID is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file.");
      return;
    }

    if (!isScriptLoaded || !window.google?.accounts?.id) {
      onError?.("Google Sign-In SDK is loading. Please try again in a moment.");
      return;
    }

    // Trigger Google One Tap / Sign In prompt
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        const renderedBtn = buttonContainerRef.current?.querySelector('div[role="button"]') as HTMLElement;
        if (renderedBtn) {
          renderedBtn.click();
        }
      }
    });
  };

  const isLoading = isAuthenticating || disabled;
  const buttonText = label || (mode === "signup" ? "Google Sign-Up" : "Google Sign-In");

  return (
    <div className="w-full relative h-full">
      {/* Visual Custom Button */}
      <button
        type="button"
        onClick={handleCustomButtonClick}
        disabled={isLoading}
        className="w-full h-full min-h-[46px] relative flex items-center justify-center space-x-2.5 py-3 px-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed group overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-4 w-4 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-slate-600 text-xs font-medium truncate">
              Connecting...
            </span>
          </div>
        ) : (
          <>
            {/* Multi-colored Google "G" Icon */}
            <svg
              className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
              {buttonText}
            </span>
          </>
        )}
      </button>

      {/* Transparent overlay for native Google Sign-In click when initialized */}
      {clientId && !isLoading && (
        <div
          ref={buttonContainerRef}
          className="absolute inset-0 z-10 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center pointer-events-auto"
        />
      )}
    </div>
  );
};
