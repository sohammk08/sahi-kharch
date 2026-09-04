import {
  addDoc,
  getDocs,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/useAuth.js";
import { friendlyError } from "../lib/errors.js";
import { useState, useEffect, useRef } from "react";
import SidePanel from "../components/ask/SidePanel.jsx";
import ChatSection from "../components/ask/ChatSection.jsx";
import { createClaimAndRunVerdict } from "../lib/pipeline.js";
import { translateText, speakText, transcribeAudio } from "../lib/api.js";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// Recording limits: 1s floor so a tap doesn't yield empty audio, 30s hard cap
// (Sarvam's STT rejects anything longer)
const MIN_RECORD_MS = 1000;
const MAX_RECORD_MS = 30000;
const nowMs = () => Date.now();

function Ask() {
  const { user, profile } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [lang, setLang] = useState("hi-IN");
  const [receiptId, setReceiptId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [attachedName, setAttachedName] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedRef = useRef(0);
  const autoStopRef = useRef(null);
  const scrollRef = useRef(null);

  // Load policies from Firestore on mount
  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "policies"))
      .then((p) => {
        setPolicies(
          p.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort(
              (a, b) =>
                (b.uploadDate?.seconds || 0) - (a.uploadDate?.seconds || 0),
            ),
        );
      })
      .finally(() => setLoadingData(false));
  }, [user]);

  // Upload a receipt: parse via backend, save to Firestore, then select it
  const uploadReceipt = async (file) => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError("");
    setAttachedName("");
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/api/receipts/parse`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Extraction failed");
      }
      const { extracted, confidence } = await res.json();

      const ref = await addDoc(collection(db, "receipts"), {
        uploadedBy: user.uid,
        uploadDate: serverTimestamp(),
        fileName: file.name,
        fileUrl: "",
        extracted,
        confidence,
        status: "parsed",
      });
      setReceiptId(ref.id);
      setAttachedName(file.name);
    } catch (err) {
      setUploadError(friendlyError(err));
    } finally {
      setUploading(false);
    }
  };

  // Auto-scroll to bottom whenever there's a new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Send text to backend for claim creation and verdict generation
  const sendText = async (raw) => {
    const text = raw.trim();
    if (!text || busy || !receiptId || !policyId) return;
    setError("");
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    try {
      const res = await createClaimAndRunVerdict({
        receiptId,
        policyId,
        employeeId: user.uid,
        actorId: user.uid,
        actorName: profile?.name ?? user.email,
      });

      const reasoningEn = res.llmOutput.reasoning || "";
      const translatedReasoning =
        lang === "en-IN" ? reasoningEn : await translateText(reasoningEn, lang);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          verdict: res.llmOutput.verdict,
          reasoning: translatedReasoning,
          reasoningEn,
          citedClauses: res.retrievedClauses.filter((c) =>
            res.llmOutput.citedClauseIds.includes(c.clauseId),
          ),
          lang,
        },
      ]);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  // Recording and transcription logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (nowMs() - startedRef.current < MIN_RECORD_MS) {
          setError("Recording too short — hold the mic for at least a second.");
          return;
        }
        setTranscribing(true);
        try {
          const transcript = (
            await transcribeAudio(
              new Blob(chunksRef.current, { type: "audio/webm" }),
              lang,
            )
          ).trim();
          if (!transcript) {
            setError("Couldn't hear anything — please try again.");
            return;
          }
          if (!receiptId || !policyId) {
            setError("Attach a receipt and select a policy first, then send.");
            setInput(transcript);
            return;
          }
          await sendText(transcript);
        } catch (err) {
          setError(friendlyError(err));
        } finally {
          setTranscribing(false);
        }
      };
      startedRef.current = nowMs();
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current?.state === "recording") stopRecording();
      }, MAX_RECORD_MS);
    } catch {
      setError("Microphone access denied.");
    }
  };

  // Stop recording and clean up
  const stopRecording = () => {
    clearTimeout(autoStopRef.current);
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const play = async (text, msgLang) => {
    const url = await speakText(text, msgLang);
    return new Audio(url);
  };

  // Mic button props for ChatSection
  const micProps = {
    onClick: recording ? stopRecording : startRecording,
    ariaLabel: recording ? "Stop recording" : "Voice input",
    recording,
    transcribing,
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-[#f7f7f5] text-black">
      {/* Two flex sections: panel on the left, chat on the right */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
        <SidePanel
          lang={lang}
          setLang={setLang}
          policies={policies}
          policyId={policyId}
          setPolicyId={setPolicyId}
          loading={loadingData}
        />
        <ChatSection
          messages={messages}
          busy={busy}
          error={error}
          scrollRef={scrollRef}
          input={input}
          setInput={setInput}
          onPlay={play}
          onError={setError}
          onPickFile={uploadReceipt}
          uploading={uploading}
          attachedName={attachedName}
          uploadError={uploadError}
          onSend={(e) => {
            e?.preventDefault();
            sendText(input);
          }}
          micProps={micProps}
          sendDisabled={
            !input.trim() || busy || transcribing || !receiptId || !policyId
          }
          placeholder={
            transcribing
              ? "Transcribing…"
              : recording
                ? "Listening…"
                : "Type your question…"
          }
        />
      </div>
    </main>
  );
}

export default Ask;
