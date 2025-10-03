// import ApiDocsViewer from "./components/ApiDocsViewer.jsx";
import Pages from "@/pages/index.jsx";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Pages />
      {/* Viewer stays visible on the main screen */}
      {/* <ApiDocsViewer /> */}
      <Toaster />
    </AuthProvider>
  );
}

export default App;
