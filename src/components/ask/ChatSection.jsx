import {
  FaStop,
  FaArrowUp,
  FaRegImage,
  FaMicrophone,
  FaCircleNotch,
  FaRegFileImage,
} from "react-icons/fa6";
import { MdInfo } from "react-icons/md";
import AssistantBubble from "./AssistantBubble.jsx";

export default function ChatSection({
  busy,
  error,
  input,
  onSend,
  onPlay,
  onError,
  micProps,
  setInput,
  messages,
  scrollRef,
  uploading,
  onPickFile,
  placeholder,
  uploadError,
  sendDisabled,
  attachedName,
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded-3xl border border-[#e6e6e6] bg-white p-6"
      >
        {messages.length === 0 && (
          <p className="body-sm text-black/60">
            Attach a receipt &amp; select a policy, then ask: “Is this claim
            allowed?”
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="text-right">
              <span className="inline-block max-w-[80%] rounded-2xl bg-[#1f1d3d] px-4 py-2 body text-white">
                {m.text}
              </span>
            </div>
          ) : (
            <AssistantBubble
              key={i}
              msg={m}
              lang={m.lang}
              onPlay={() => onPlay(m.reasoning, m.lang)}
              onError={(err) => onError(err)}
            />
          ),
        )}
        {busy && <p className="body text-black/40">Thinking…</p>}
      </div>

      {error && <p className="mt-3 body-sm text-[#ff3d8b] shrink-0">{error}</p>}

      {/* outer blue shell */}
      <div className="mt-4 flex shrink-0 flex-col rounded-[28px] bg-[#1f9cf0]">
        <div className="flex items-center gap-2 rounded-2xl  px-4 py-3 body-sm text-white">
          {uploading ? (
            <>
              <FaCircleNotch className="size-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : uploadError ? (
            <span>{uploadError}</span>
          ) : attachedName ? (
            <>
              <FaRegFileImage className="size-4 shrink-0" />
              <p className="font-semibold">
                Image <span className="font-mono">{attachedName}</span> is
                attached
              </p>
            </>
          ) : (
            <p className="flex items-center font-medium gap-2 text-white/90">
              <MdInfo />
              Your uploaded image will appear here
            </p>
          )}
        </div>

        <form
          onSubmit={onSend}
          className="rounded-3xl bg-gray-100 p-4 m-1.5 mt-0"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            maxLength={500}
            className="w-full body-sm text-gray-900 outline-none placeholder:text-gray-500"
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label
                className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300 ${
                  uploading ? "opacity-60" : ""
                }`}
                aria-label="Attach receipt"
              >
                {uploading ? (
                  <FaCircleNotch className="size-4 animate-spin text-gray-600" />
                ) : (
                  <FaRegImage className="size-4 text-gray-600" />
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) onPickFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={micProps.onClick}
                aria-label={micProps.ariaLabel}
                className={`flex size-10 items-center justify-center rounded-full ${
                  micProps.recording
                    ? "bg-[#ff3d8b] text-white animate-pulse"
                    : micProps.transcribing
                      ? "bg-gray-300 text-gray-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {micProps.recording ? <FaStop /> : <FaMicrophone />}
              </button>
            </div>

            <button
              type="submit"
              disabled={sendDisabled}
              aria-label="Send"
              className="flex size-8 items-center justify-center rounded-full bg-[#1f9cf0] text-white transition-colors hover:bg-[#1a8ad6] disabled:opacity-50"
            >
              <FaArrowUp className="size-4 rotate-45" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
