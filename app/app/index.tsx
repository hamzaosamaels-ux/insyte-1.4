import { Redirect } from "expo-router";

// Phase 0: no real auth state exists yet (that's Phase 1's AuthContext).
// Always land on the welcome screen for now.
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
