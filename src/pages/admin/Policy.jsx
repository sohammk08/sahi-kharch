import PolicyUpload from "./PolicyUpload.jsx";
import PolicyLibrary from "./PolicyLibrary.jsx";

function Policy() {
  return (
    <main className="bg-[#f7f7f5] h-[calc(100vh-4rem)] text-black">
      <div className="mx-auto  px-8 py-10 md:px-12">
        <h1 className="eyebrow">Policy</h1>
        <p className="body">
          Upload a new policy version and browse everything uploaded so far.
        </p>

        <div className="mt-15 flex flex-col gap-50 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <PolicyUpload />
          </div>
          <div className="min-w-0 flex-1">
            <PolicyLibrary />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Policy;
