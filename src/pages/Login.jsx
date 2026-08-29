function Login() {
  return (
    <section className="bg-[#dceeb1] text-black">
      <div className="mx-auto max-w-6xl px-8 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-md rounded-3xl border border-[#e6e6e6] bg-white p-12">
          <h1 className="eyebrow">Sign in</h1>
          <h2 className="mt-4 headline">Welcome back</h2>
          <p className="mt-3 body">
            Sign in to review claims, check verdicts, and track reimbursements.
          </p>

          <form className="mt-10 flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@company.com"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>

            <button
              type="button"
              className="mt-2 rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white"
            >
              Log in
            </button>
          </form>

          <p className="mt-8 text-center body-sm">
            Don&apos;t have an account?{" "}
            <a href="mailto:demo@sahikharch.in" className="link underline">
              Request a demo
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
