import AssistantBubble from "./AssistantBubble.jsx";
import { FaMicrophone, FaStop } from "react-icons/fa6";

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
  placeholder,
  sendDisabled,
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded-3xl border border-[#e6e6e6] bg-white p-6"
      >
        {messages.length === 0 && (
          <p className="body-sm text-black/60">
            Select a receipt &amp; policy, then ask: “Is this claim allowed?”
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

      <form
        onSubmit={onSend}
        className="mt-4 flex shrink-0 items-center gap-3 rounded-full border border-[#e6e6e6] bg-white px-4 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          className="flex-1 bg-transparent px-2 py-2 body-sm outline-none"
        />
        <button
          type="button"
          onClick={micProps.onClick}
          aria-label={micProps.ariaLabel}
          className={`flex size-10 items-center justify-center rounded-full ${
            micProps.recording
              ? "bg-[#ff3d8b] text-white animate-pulse"
              : micProps.transcribing
                ? "bg-[#e6e6e6]"
                : "bg-[#f7f7f5]"
          }`}
        >
          {micProps.recording ? <FaStop /> : <FaMicrophone />}
        </button>
        <button
          type="submit"
          disabled={sendDisabled}
          className="rounded-[50px] bg-black px-5 py-2 body-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
