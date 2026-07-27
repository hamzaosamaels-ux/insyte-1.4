import React from "react";
import { View, Text, Pressable } from "react-native";

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

// Catches render/runtime errors in any child screen. Unlike web's version,
// there's no window.location.reload() equivalent on native — "Try again"
// just resets this boundary's own state instead.
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

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-[#0b081a] p-6">
        <View className="max-w-sm items-center">
          <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display text-center">
            Something broke on this screen
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed text-center">
            The rest of insyte is fine — trying again usually fixes it. Nothing you did was lost.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="mt-5 px-5 py-3 bg-indigo-600 rounded-xl active:bg-indigo-500"
          >
            <Text className="text-white text-xs font-bold">Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}
