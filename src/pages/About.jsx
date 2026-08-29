import problems from "../data/problems.json";
import steps from "../data/howItWorks.json";
import differentiators from "../data/differentiators.json";

function About() {
  return (
    <>
      <section className="bg-white text-black">
        <div className="mx-auto max-w-6xl px-8 py-24 md:px-12 md:py-32">
          <h1 className="eyebrow">About</h1>
          <p className="mt-6 max-w-2xl display-lg">
            Sahi Kharch is a risk-aware, multilingual expense-compliance
            co-pilot.
          </p>
          <p className="mt-8 max-w-2xl body-lg">
            From a receipt photo to a cited verdict to a live payout — in your
            own language. Sahi Kharch turns a policy PDF into a decision engine
            every employee can actually use.
          </p>
        </div>
      </section>

      <section className="bg-[#c5b0f4] text-black">
        <div className="mx-auto max-w-6xl px-8 py-24 md:px-12">
          <h2 className="eyebrow">The problem</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="rounded-3sxl bg-white/70 p-8">
                <h3 className="card-title">{p.title}</h3>
                <p className="mt-3 body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-black">
        <div className="mx-auto max-w-6xl px-8 py-24 md:px-12">
          <h2 className="eyebrow">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <span className="block text-[12px] font-mono uppercase tracking-[0.6px]">
                  0{i + 1}
                </span>
                <h3 className="mt-2 headline">{s.title}</h3>
                <p className="mt-2 body-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4ecd6] text-black">
        <div className="mx-auto max-w-6xl px-8 py-24 md:px-12">
          <h2 className="eyebrow">Why Sahi Kharch</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {differentiators.map((d) => (
              <div
                key={d.title}
                className="rounded-3xl border border-[#e6e6e6] bg-white p-8"
              >
                <h3 className="card-title">{d.title}</h3>
                <p className="mt-3 body">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-black">
        <div className="mx-auto max-w-6xl px-8 py-24 text-center md:px-12">
          <h2 className="headline">See Sahi Kharch close the loop</h2>
          <p className="mx-auto mt-4 max-w-xl body">
            From a receipt photo to a cited verdict to a live payout — your own
            language.
          </p>
          <div className="mt-10">
            <a
              href="mailto:demo@sahikharch.in"
              className="inline-block rounded-[50px] bg-black px-6 py-3 text-[20px] font-medium text-white"
            >
              Request a demo
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
