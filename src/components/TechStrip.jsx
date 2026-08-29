function TechStrip() {
  return (
    <section className="bg-[#1f1d3d] text-white">
      <div className="mx-auto max-w-6xl px-8 py-20 md:px-12">
        <p className="eyebrow text-white/60">Built on</p>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:gap-16">
          <div>
            <span className="text-[20px] font-[480] tracking-[-0.1px]">
              Powered by Sarvam AI
            </span>
            <p className="mt-1 text-[16px] font-[330] leading-[1.45] tracking-[-0.14px] text-white/70">
              Native Indian-language speech, translation, and TTS.
            </p>
          </div>
          <div>
            <span className="text-[20px] font-[480] tracking-[-0.1px]">
              RazorpayX Payouts
            </span>
            <p className="mt-1 text-[16px] font-[330] leading-[1.45] tracking-[-0.14px] text-white/70">
              Test-mode reimbursement that closes the loop.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TechStrip;
