import problems from "../data/problems.json";

function Problems() {
  return (
    <section className="bg-white text-black">
      <div className="mx-auto max-w-6xl px-8 py-24 md:px-12">
        <h2 className="eyebrow">The problem</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="rounded-lg bg-[#f7f7f5] p-6">
              <h3 className="text-[24px] font-bold leading-[1.45]">
                {p.title}
              </h3>
              <p className="mt-3 text-[16px] font-[330] leading-[1.45] tracking-[-0.14px]">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Problems;
