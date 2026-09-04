import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    const name = form.get("name").trim();
    const email = form.get("email").trim();
    const password = form.get("password");

    if (!name) return setError("Name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email");
    if (password.length < 8) return setError("Password must be at least 8 characters");

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.code === "auth/email-already-in-use" ? "Email already registered" : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#dceeb1] text-black">
      <div className="mx-auto max-w-6xl px-8 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-md rounded-3xl border border-[#e6e6e6] bg-white p-12">
          <h1 className="eyebrow">Create account</h1>
          <h2 className="mt-4 headline">Join Sahi Kharch</h2>
          <p className="mt-3 body">
            Registration is for company admins/HRs. If you&apos;re an employee,
            contact your company admin to create an account for you.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Name</span>
              <input
                name="name"
                placeholder="Your name"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@company.com"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>

            {error && <p className="body-sm text-[#ff3d8b]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white disabled:opacity-50"
            >
              {loading ? "Creating…" : "Register"}
            </button>
          </form>

          <p className="mt-8 text-center body-sm">
            Already have an account?{" "}
            <Link to="/login" className="link underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;
