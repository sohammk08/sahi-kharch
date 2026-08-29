import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

const links = [
  { to: "/admin/policy-upload", label: "Policy Upload" },
  { to: "/admin/policy-library", label: "Policy Library" },
  { to: "/dev/receipt-tester", label: "Receipt Tester" },
];

function AdminNav() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-white text-black">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-8 md:px-12">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Sahi Kharch
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="body-sm rounded-full px-3 py-2 hover:bg-[#f7f7f5]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <span className="body-sm hidden md:block">Hey, {profile?.name ?? "there"}</span>
          <button
            onClick={handleLogout}
            className="rounded-[50px] bg-black px-5 py-2 text-[15px] font-medium text-white"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminNav;
