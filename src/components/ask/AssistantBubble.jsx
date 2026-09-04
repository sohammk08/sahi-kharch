import { label } from "./shared.js";
import { VERDICT_STYLES } from "../../lib/ui.js";
import { useState, useEffect, useRef } from "react";
import { FaSpinner, FaVolumeHigh } from "react-icons/fa6";

function AssistantBubble({ msg, lang, onPlay, onError }) {
  const [showWhy, setShowWhy] = useState(false);
  const [showEn, setShowEn] = useState(false);
  const [audioState, setAudioState] = useState("idle");
  const audioRef = useRef(null);
  const style =
    VERDICT_STYLES[msg.verdict] ?? VERDICT_STYLES.needs_human_review;

  // Clean up audio on unmount
  useEffect(() => () => audioRef.current?.pause(), []);

  // Handle playing the audio for the assistant's reasoning
  const handlePlay = async () => {
    if (audioState !== "idle") return;
    setAudioState("loading");
    try {
      const audio = await onPlay();
      audioRef.current = audio;
      audio.onended = () => setAudioState("idle");
      await audio.play();
      setAudioState("playing");
    } catch (err) {
      setAudioState("idle");
      onError(err);
    }
  };

  return (
    <div className="inline-block max-w-[90%] text-left">
      <div className="rounded-2xl border border-[#e6e6e6] bg-[#f7f7f5] p-4">
        <span
          className={`caption inline-block rounded-full px-3 py-1 ${style.cls}`}
        >
          {style.label}
        </span>
        <p className="mt-3 body text-black/80">{msg.reasoning}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={handlePlay}
            disabled={audioState !== "idle"}
            className="caption flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 disabled:opacity-60"
          >
            {audioState === "loading" ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaVolumeHigh
                className={audioState === "playing" ? "animate-pulse" : ""}
              />
            )}
            {label("listen", lang)}
          </button>
          {msg.citedClauses.length > 0 && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              className="caption flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-4 py-2"
            >
              {label("why", lang)}{" "}
              <span className="text-black/40">{showWhy ? "▲" : "▼"}</span>
            </button>
          )}
          {lang !== "en-IN" && (
            <button
              onClick={() => setShowEn((v) => !v)}
              className="caption flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-4 py-2"
            >
              EN {showEn ? "▲" : "▼"}
            </button>
          )}
        </div>

        {showEn && (
          <p className="mt-3 border-t border-[#e6e6e6] pt-3 body-sm text-black/60">
            {msg.reasoningEn}
          </p>
        )}

        {showWhy && msg.citedClauses.length > 0 && (
          <div className="mt-3 space-y-3 border-t border-[#e6e6e6] pt-3">
            {msg.citedClauses.map((c) => (
              <blockquote
                key={c.clauseId}
                className="rounded-xl border-l-4 border-[#1f1d3d] bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="caption rounded-full bg-[#1f1d3d] px-3 py-1 text-white">
                    {c.clauseId}
                  </span>
                  <span className="body-sm font-[480]">{c.heading}</span>
                  <span className="caption text-black/40">
                    {label("page", lang)} {c.pageNumber}
                  </span>
                </div>
                <p className="mt-2 body-sm text-black/80">{c.text}</p>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssistantBubble;
