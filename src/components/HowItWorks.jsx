import steps from "../data/howItWorks.json";
import {
  TbCheck,
  TbUpload,
  TbMessageCircle,
  TbCurrencyRupee,
} from "react-icons/tb";

const icons = {
  upload: TbUpload,
  message: TbMessageCircle,
  check: TbCheck,
  rupee: TbCurrencyRupee,
};

function HowItWorks() {
  return (
    <section className="bg-[#dceeb1] text-black">
      <div className="mx-auto max-w-6xl px-8 py-24 md:px-12">
        <h2 className="eyebrow">How it works</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = icons[s.icon];
            return (
              <div key={s.title} className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                  <Icon className="h-8 w-8" />
                </div>
                <span className="mt-6 block text-[12px] font-mono uppercase tracking-[0.6px]">
                  0{i + 1}
                </span>
                <h3 className="mt-2 text-[26px] font-[540] leading-[1.35] tracking-[-0.26px]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[16px] font-[330] leading-[1.45] tracking-[-0.14px]">
                  {s.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
