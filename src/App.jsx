import Ask from "./pages/Ask";
import Login from "./pages/Login";
import About from "./pages/About";
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import AuditLog from "./pages/dev/AuditLog";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ClaimConsole from "./pages/dev/ClaimConsole";
import ReceiptTester from "./pages/dev/ReceiptTester";
import PolicyUpload from "./pages/admin/PolicyUpload";
import PolicyLibrary from "./pages/admin/PolicyLibrary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext.jsx";
import ConsistencyCheck from "./pages/dev/ConsistencyCheck";

function App() {
  return (
    <AuthProvider>
      <div className="font-sans text-black antialiased">
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Nav />
                <Landing />
                <Footer />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <Nav />
                <About />
                <Footer />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Nav />
                <Login />
                <Footer />
              </>
            }
          />
          <Route
            path="/register"
            element={
              <>
                <Nav />
                <Register />
                <Footer />
              </>
            }
          />
          <Route
            path="/admin/policy-upload"
            element={
              <ProtectedRoute>
                <Nav />
                <PolicyUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/policy-library"
            element={
              <ProtectedRoute>
                <Nav />
                <PolicyLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/receipt-tester"
            element={
              <ProtectedRoute>
                <Nav />
                <ReceiptTester />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/claim-console"
            element={
              <ProtectedRoute>
                <Nav />
                <ClaimConsole />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/audit-log"
            element={
              <ProtectedRoute>
                <Nav />
                <AuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ask"
            element={
              <ProtectedRoute>
                <div className="flex h-screen flex-col overflow-hidden">
                  <div className="shrink-0">
                    <Nav />
                  </div>
                  <Ask />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/consistency-check"
            element={
              <ProtectedRoute>
                <Nav />
                <ConsistencyCheck />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
