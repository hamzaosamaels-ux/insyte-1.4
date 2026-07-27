import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

// Catches render/runtime errors in any child component so one crash shows a
// recovery screen instead of a blank white page.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI crash caught by ErrorBoundary:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b081a] p-6 text-center">
        <div className="max-w-sm">
          <div className="inline-flex p-3 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-2xl mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
            Something broke on this screen
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
            The rest of insyte is fine - reloading usually fixes it. Nothing you
            did was lost.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="h-4 w-4" /> Reload
          </button>
        </div>
      </div>
    );
  }
}
