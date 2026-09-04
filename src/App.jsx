import Ask from "./pages/Ask";
import Login from "./pages/Login";
import About from "./pages/About";
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import People from "./pages/admin/People";
import Policy from "./pages/admin/Policy";
import BatchRun from "./pages/admin/BatchRun";
import AuditLog from "./pages/admin/AuditLog";
import Dashboard from "./pages/admin/Dashboard";
import { Routes, Route } from "react-router-dom";
import ClaimDetail from "./pages/admin/ClaimDetail";
import ScrollToTop from "./components/ScrollToTop";
import ClaimConsole from "./pages/dev/ClaimConsole";
import ReceiptTester from "./pages/dev/ReceiptTester";
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
            path="/admin/policy"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <Policy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/claim/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <ClaimDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-trail"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <AuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/batch-run"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <BatchRun />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/people"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <People />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/receipt-tester"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <ReceiptTester />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/claim-console"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Nav />
                <ClaimConsole />
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
              <ProtectedRoute roles={["admin"]}>
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
