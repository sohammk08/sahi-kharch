import items from "../data/differentiators.json";

function Differentiators() {
  return (
    <section className="bg-white text-black">
      <div className="mx-auto max-w-6xl px-8 py-24 md:px-12">
        <h2 className="eyebrow">Why Sahi Kharch</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#e6e6e6] p-8"
            >
              <h3 className="text-[24px] font-bold leading-[1.45]">
                {item.title}
              </h3>
              <p className="mt-3 text-[16px] font-[330] leading-[1.45] tracking-[-0.14px]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Differentiators;
