import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0d0d0d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: "32px",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <img
            src="/figmaAssets/vector.svg"
            alt="Ask Migi"
            style={{ height: 36, marginBottom: 28 }}
          />
          <h1
            style={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 12px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              maxWidth: 360,
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            An unexpected error occurred. Please refresh the page or contact{" "}
            <a
              href="mailto:support@askmigi.com"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              support@askmigi.com
            </a>{" "}
            if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "none",
              borderRadius: 100,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
