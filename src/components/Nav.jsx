import { useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaXmark, FaDev } from "react-icons/fa6";

const navLinks = [{ to: "/about", label: "About" }];
const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/batch-run", label: "Batch Run" },
  { to: "/admin/audit-trail", label: "Audit Trail" },
  { to: "/admin/people", label: "People" },
  { to: "/admin/policy", label: "Policy" },
  { to: "/dev/receipt-tester", label: "Receipt Tester", dev: true },
  { to: "/dev/claim-console", label: "Claim Console", dev: true },
  { to: "/dev/consistency-check", label: "Consistency Check", dev: true },
];

function Nav() {
  const [open, setOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === "admin";
  const links = isAdmin
    ? adminLinks
    : navLinks.filter((l) => l.to !== "/about" || !user);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-white text-black">
      <div className="mx-auto flex h-14  items-center justify-between px-8 md:px-12">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Sahi Kharch
          </Link>
        </div>
        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative body-sm rounded-full px-3 py-2 hover:bg-[#f7f7f5]"
            >
              {l.label}
              {l.dev && (
                <FaDev className="absolute -top-1 right-0 size-3 text-[#1f3d8b]" />
              )}
            </Link>
          ))}
          {user && !isAdmin && (
            <Link
              to="/ask"
              className="body-sm rounded-full px-3 py-2 hover:bg-[#f7f7f5]"
            >
              Ask
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="hidden items-center gap-4 lg:flex">
              <span className="body-sm hidden md:block">
                Hey, {profile?.name ?? "there"}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-[50px] bg-black px-5 py-2 text-[15px] font-medium text-white"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-4 lg:flex">
              <Link
                to="/login"
                className="body-sm rounded-full px-3 py-2 hover:bg-[#f7f7f5]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-[50px] bg-black px-5 py-2 text-[15px] font-medium text-white"
              >
                Register
              </Link>
            </div>
          )}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-full bg-[#f7f7f5] text-black lg:hidden"
          >
            {open ? (
              <FaXmark className="size-5" />
            ) : (
              <FaBars className="size-5" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav className="fixed inset-0 z-50 flex flex-col bg-white px-8 pb-8 pt-6 lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              Sahi Kharch
            </Link>
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex size-10 items-center justify-center rounded-full bg-[#f7f7f5] text-black"
            >
              <FaXmark className="size-5" />
            </button>
          </div>
          <div className="mt-16 flex flex-col gap-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="relative display-lg"
              >
                {l.label}
                {l.dev && (
                  <FaDev className="absolute -top-1 right-0 size-3 text-[#1f3d8b]" />
                )}
              </Link>
            ))}
            {user && !isAdmin && (
              <Link
                to="/ask"
                onClick={() => setOpen(false)}
                className="display-lg"
              >
                Ask
              </Link>
            )}
          </div>
          <div className="mt-auto flex flex-col gap-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="block rounded-[50px] bg-black px-6 py-3 text-center text-[20px] font-medium text-white"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-[50px] border border-[#e6e6e6] px-6 py-3 text-center text-[20px] font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="block rounded-[50px] bg-black px-6 py-3 text-center text-[20px] font-medium text-white"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Nav;
