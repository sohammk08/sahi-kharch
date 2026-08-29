import { useState } from "react";
import { Link } from "react-router-dom";
import links from "../data/navLinks.json";
import { FaBars, FaXmark } from "react-icons/fa6";

function Nav() {
  const [open, setOpen] = useState(false);

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
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="mailto:demo@sahikharch.in"
            className="hidden rounded-[50px] bg-black px-5 py-2 text-[15px] font-medium text-white lg:block"
          >
            Request a demo
          </a>
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
                className="display-lg"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto">
            <a
              href="mailto:demo@sahikharch.in"
              onClick={() => setOpen(false)}
              className="block rounded-[50px] bg-black px-6 py-3 text-center text-[20px] font-medium text-white"
            >
              Request a demo
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Nav;
