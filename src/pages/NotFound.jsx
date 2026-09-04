import { Link } from "react-router-dom";
import { FaPlane } from "react-icons/fa";

function NotFound() {
  return (
    <main className="relative overflow-hidden bg-[#f7f7f5] text-black">
      <style>{`
        @keyframes fly-left-to-right {
          from {
            left: -200%;
          }
          to {
            left: 200%;
          }
        }
      `}</style>

      <FaPlane
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 -rotate-12 select-none text-[35rem] text-black/4"
        style={{
          left: "-200%",
          animation: "fly-left-to-right 5s linear infinite",
          willChange: "left",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-8 py-24 md:px-12 justify-center text-center">
        <p className="eyebrow font-doto italic font-medium text-[20rem]">404</p>
        <h1 className="mt-2 headline">Page not found</h1>
        <p className="mt-3 body text-black/60">
          That page doesn&apos;t exist. Back to the landing page.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
