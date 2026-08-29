import SpinningText from "./SpinningText";
import { TbCoinRupee } from "react-icons/tb";

function Hero() {
  return (
    <section className="bg-white text-black">
      <div className="mx-auto flex max-w-6xl items-center gap-10 px-8 py-24 md:px-12 md:py-32">
        <div className="min-w-0 flex-1">
          <h1 className="text-[48px] font-[340] leading-none tracking-[-1.72px] md:text-[86px]">
            Sahi Kharch
          </h1>

          <p className="mt-8 max-w-2xl text-[20px] font-[330] leading-[1.4] tracking-[-0.14px]">
            A risk-aware, multilingual expense-compliance co-pilot.
          </p>
          <p className="mt-3 max-w-2xl text-[18px] font-[320] leading-[1.45] tracking-[-0.26px] text-black">
            Inconsistent approvals, no audit trail, and a workforce locked out
            of an English-only policy. Sahi Kharch fixes all three.
          </p>
          <div className="mt-10">
            <a
              href="mailto:demo@sahikharch.in"
              className="rounded-[50px] bg-black px-6 py-3 text-[20px] font-medium text-white"
            >
              See it in action
            </a>
          </div>
        </div>
        <div className="relative hidden size-72 shrink-0 items-center justify-center md:flex">
          <SpinningText
            duration={14}
            radius={9.5}
            className="size-full text-[17px] font-semibold uppercase"
          >
            sahi kharch • policy copilot •
          </SpinningText>
          <div className="absolute flex size-28 items-center justify-center rounded-full bg-black text-white">
            <TbCoinRupee className="size-14" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
