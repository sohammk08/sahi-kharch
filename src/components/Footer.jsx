import { Link } from "react-router-dom";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedinIn, FaGithub } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-white text-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:gap-4 px-8 py-16 md:flex-row md:items-center md:justify-between md:px-3">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          Sahi Kharch
        </Link>
        <p className="text-[16px] font-[330] leading-[1.45] tracking-[-0.14px]">
          Risk-aware, multilingual expense compliance.
        </p>
        <nav className="flex items-center gap-4">
          <Link to="/about" className="caption text-black hover:underline">
            About
          </Link>
          <Link to="/login" className="caption text-black hover:underline">
            Login
          </Link>
          <a
            href="https://www.github.com/sohammk08/sahi-kharch"
            className="caption text-black hover:underline"
          >
            github
          </a>
        </nav>

        <span className="flex justify-center items-center bg-[#f7f7f5] px-3 py-2 rounded-lg text-sm font-doto">
          <span className="hidden font-bold sm:inline text-black/75">
            Created by Sohamm Kulkarni
          </span>
          <span className="sm:hidden text-black">Built by Sohamm</span>
          <div className="flex -space-x-1.5 ml-3 sm:ml-4">
            {/* GitHub */}
            <div
              className="size-6 sm:size-7 rounded-full bg-white ring-2 ring-black/15 cursor-pointer flex items-center justify-center"
              title="Open GitHub"
              onClick={() =>
                window.open("https://github.com/sohammk08", "_blank")
              }
            >
              <FaGithub className="size-5 sm:size-5.5 text-black" />
            </div>

            {/* X (Twitter) */}
            <div
              className="size-6 sm:size-7 rounded-full bg-black ring-2 ring-black/15 cursor-pointer flex items-center justify-center"
              title="Open X"
              onClick={() =>
                window.open("https://x.com/skulkarni2517", "_blank")
              }
            >
              <FaXTwitter className="size-5 p-0.5 text-white" />
            </div>

            {/* LinkedIn */}
            <div
              className="size-6 sm:size-7 rounded-full bg-[#0A66C2] ring-2 ring-black/15 cursor-pointer flex items-center justify-center"
              title="Open LinkedIn"
              onClick={() =>
                window.open(
                  "https://www.linkedin.com/in/sohamm-kulkarni-1b418b292/",
                  "_blank",
                )
              }
            >
              <FaLinkedinIn className="size-5 p-0.5 text-white" />
            </div>
          </div>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
