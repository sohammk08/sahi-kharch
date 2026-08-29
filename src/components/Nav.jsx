import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import links from "../data/navLinks.json";
import { FaBars, FaXmark } from "react-icons/fa6";
import { useAuth } from "../context/useAuth.js";

function Nav() {
  const [open, setOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-white text-black">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-8 md:px-12">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Sahi Kharch
          </Link>
          <nav className="hidden items-center gap-2 lg:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="body-sm rounded-full px-3 py-2 hover:bg-[#f7f7f5]"
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/admin/policy-upload"
                className="body-sm rounded-full px-3 py-2 hover:bg-[#f7f7f5]"
              >
                Console
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="hidden items-center gap-4 lg:flex">
              <span className="body-sm">Hey, {profile?.name ?? "there"}</span>
              <button
                onClick={handleLogout}
                className="rounded-[50px] bg-black px-5 py-2 text-[15px] font-medium text-white"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-4 lg:flex">
              <Link to="/login" className="body-sm px-3 py-2 hover:bg-[#f7f7f5] rounded-full">
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
            {open ? <FaXmark className="size-5" /> : <FaBars className="size-5" />}
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
                className="display-lg"
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link to="/admin/policy-upload" onClick={() => setOpen(false)} className="display-lg">
                Console
              </Link>
            )}
          </div>
          <div className="mt-auto flex flex-col gap-3">
            {user ? (
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
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
