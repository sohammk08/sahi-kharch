import Login from "./pages/Login";
import About from "./pages/About";
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import AdminNav from "./components/AdminNav";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ReceiptTester from "./pages/dev/ReceiptTester";
import PolicyUpload from "./pages/admin/PolicyUpload";
import PolicyLibrary from "./pages/admin/PolicyLibrary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext.jsx";

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
                <AdminNav />
                <PolicyUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/policy-library"
            element={
              <ProtectedRoute>
                <AdminNav />
                <PolicyLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/receipt-tester"
            element={
              <ProtectedRoute>
                <AdminNav />
                <ReceiptTester />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
