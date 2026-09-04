import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth } from "../../firebase.js";
import { friendlyError } from "../../lib/errors.js";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

function People() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  // On mount, fetch all users, keep employees only, alphabetize, and fill the dropdown
  useEffect(() => {
    getDocs(collection(db, "users"))
      .then((snap) => {
        setEmployees(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => u.role === "employee")
            .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    const form = new FormData(e.target);
    const name = form.get("name").trim();
    const email = form.get("email").trim();
    const password = form.get("password");
    const holderName = form.get("holderName").trim();
    const ifsc = form.get("ifsc").trim();
    const accountNumber = form.get("accountNumber").trim();
    const upiVpa = form.get("upiVpa").trim();

    if (!name) return setError("Name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Enter a valid email");
    if (password.length < 8)
      return setError("Password must be at least 8 characters");

    try {
      // Create the auth user on the secondary app so the admin stays signed in.
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        role: "employee",
        createdAt: new Date(),
        bankAccount:
          accountNumber || upiVpa
            ? {
                holderName,
                ifsc,
                accountNumber,
                vpa: upiVpa,
              }
            : null,
      });
      await signOut(secondaryAuth);
      e.target.reset();
      setEmployees((prev) =>
        [...prev, { id: cred.user.uid, name, email, role: "employee" }].sort(
          (a, b) => (a.name ?? "").localeCompare(b.name ?? ""),
        ),
      );
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email already registered"
          : friendlyError(err),
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">People</h1>
        <p className="mt-3 body">
          Create accounts for employees. Employees register to submit claims;
          admins and HRs self-register.
        </p>

        <form
          onSubmit={handleCreate}
          className="mt-10 grid gap-8 rounded-3xl border border-[#e6e6e6] bg-white p-8 lg:grid-cols-[1fr_240px]"
        >
          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Employee name</span>
              <input
                name="name"
                placeholder="e.g. Priya Sharma"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Email</span>
              <input
                type="email"
                name="email"
                placeholder="priya@company.com"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Temporary password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>
            <div className="mt-2 rounded-xl border border-[#f1f1f1] bg-[#f7f7f5] p-4">
              <p className="caption text-black/50">
                Bank / UPI details (used for RazorpayX payout; dummy values for
                test mode)
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="caption text-black/50">Account holder</span>
                  <input
                    name="holderName"
                    placeholder="Priya Sharma"
                    className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-2.5 body-sm placeholder:text-black/40"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="caption text-black/50">IFSC</span>
                  <input
                    name="ifsc"
                    placeholder="HDFC0000123"
                    className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-2.5 body-sm placeholder:text-black/40"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="caption text-black/50">Account number</span>
                  <input
                    name="accountNumber"
                    placeholder="000000012345"
                    className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-2.5 body-sm placeholder:text-black/40"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="caption text-black/50">UPI VPA</span>
                  <input
                    name="upiVpa"
                    placeholder="priya@okhdfc"
                    className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-2.5 body-sm placeholder:text-black/40"
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4">
            {error && <p className="body-sm text-[#ff3d8b]">{error}</p>}
            <button
              type="submit"
              disabled={creating}
              className="rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>

        <div className="mt-10 overflow-x-auto rounded-3xl border border-[#e6e6e6] bg-white">
          {loading ? (
            <p className="p-8 body">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="p-8 body">No employee accounts yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="caption border-b border-[#e6e6e6] text-black/50">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#f1f1f1] last:border-0"
                  >
                    <td className="px-6 py-4 body-sm font-[480]">
                      {u.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 body-sm">{u.email ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className="caption rounded-full bg-[#d3e3f5] px-3 py-1 text-black">
                        Employee
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}

export default People;
