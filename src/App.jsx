import Login from "./pages/Login";
import About from "./pages/About";
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Footer from "./components/Footer";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <div className="font-sans text-black antialiased">
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
