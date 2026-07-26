import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Copy,
  ImagePlus,
  MessageCircle,
  Search,
  ShieldCheck,
  Tag,
} from "lucide-react";
import brandBoard from "@/imports/ChatGPT_Image_Jul_26__2026__09_23_55_PM__1_.png";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

type Screen = "home" | "confirm" | "analysing" | "result" | "comparables" | "offer" | "risks";

const display = "font-['Barlow']";
const body = "font-['Inter']";

function BrandMark() {
  return (
    <div className="flex items-center gap-2" aria-label="SussIt">
      <span className="relative block h-7 w-7 overflow-hidden rounded-[8px] bg-[#111111]">
        <ImageWithFallback
          src={brandBoard}
          alt="SussIt icon"
          className="absolute left-[-125px] top-[-11px] w-[169px] max-w-none"
        />
      </span>
      <span className={`${display} text-[23px] font-black leading-none tracking-[-0.055em] text-[#faf8f5]`}>
        Suss<span className="text-[#c6ff00]">It</span>
      </span>
    </div>
  );
}

function Header({ back, detail }: { back?: () => void; detail?: string }) {
  return (
    <header className="mb-8 flex items-center justify-between">
      {back ? (
        <button aria-label="Go back" onClick={back} className="grid size-10 place-items-center rounded-xl bg-[#222] text-[#faf8f5] transition hover:bg-[#2b2b2b]">
          <ArrowLeft size={19} />
        </button>
      ) : (
        <div className="w-10" />
      )}
      <BrandMark />
      <span className={`${display} w-10 text-right text-[9px] font-bold leading-[1.25] tracking-[0.14em] text-[#888]`}>
        {detail ?? "KNOW\nBEFORE"}
      </span>
    </header>
  );
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={`${display} flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c6ff00] px-5 py-4 text-[16px] font-extrabold text-[#111] transition hover:bg-[#d2ff36] active:scale-[.99]`}>{children}</button>;
}

function TextButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={`${display} flex w-full items-center justify-between border-b border-white/10 py-5 text-left text-[16px] font-bold text-[#faf8f5] transition hover:text-[#c6ff00]`}>{children}<ChevronRight size={19} /></button>;
}

function ListingLine() {
  return <div className="flex items-center gap-2 text-[13px] text-[#888]"><span className="text-lg">🥽</span><span>Meta Quest 3 512GB · <strong className="font-semibold text-[#faf8f5]">$550</strong></span></div>;
}

function Home({ go }: { go: (s: Screen) => void }) {
  return <div className="flex min-h-full flex-col px-6 pb-9 pt-5"><Header /><main className="flex flex-1 flex-col"><div className="mb-10"><h1 className={`${display} text-[48px] font-black leading-[.96] tracking-[-.045em] text-[#faf8f5]`}>Should I<br />buy this?</h1><p className={`${body} mt-4 text-[16px] leading-6 text-[#888]`}>Send a listing through. We&apos;ll suss the value.</p></div><button onClick={() => go("confirm")} className="mb-3 rounded-[22px] border border-dashed border-[#c6ff00]/30 bg-[#c6ff00]/[.025] px-5 py-10 text-center transition hover:bg-[#c6ff00]/[.06]"><span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#c6ff00]/10 text-[#c6ff00]"><ImagePlus size={27} /></span><span className={`${body} block text-[15px] font-semibold text-[#faf8f5]`}>Upload screenshot</span><span className={`${body} mt-1 block text-[13px] text-[#888]`}>Tap to add it from your camera roll</span></button><div className="my-1 flex items-center gap-3 text-[12px] text-[#888]"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div><textarea className={`${body} mb-7 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 text-[15px] leading-6 text-[#faf8f5] outline-none placeholder:text-[#888] focus:border-[#c6ff00]/50`} placeholder="Paste listing text here…" /><PrimaryButton onClick={() => go("confirm")}>Suss it out <ArrowRight size={18} /></PrimaryButton></main><p className={`${body} mt-5 text-center text-[12px] leading-5 text-[#888]`}>Works with listing screenshots and pasted listing details.</p></div>;
}

function Confirm({ go }: { go: (s: Screen) => void }) {
  const fields = [["ASKING PRICE", "$550"], ["CONDITION", "Used"], ["INCLUDED", "Controllers"], ["LISTED ON", "Marketplace"]];
  return <div className="px-6 pb-9 pt-5"><Header back={() => go("home")} detail="LISTING" /><h1 className={`${display} text-[32px] font-black leading-none tracking-[-.035em] text-[#faf8f5]`}>Confirm listing</h1><p className={`${body} mt-2 text-[15px] text-[#888]`}>Is this the right product?</p><section className="mt-7 overflow-hidden rounded-[22px] border border-white/10 bg-[#1a1a1a]"><div className="grid h-36 place-items-center border-b border-white/10 bg-[#161616] text-[66px]">🥽</div><div className="p-5"><div className="flex justify-between gap-4"><div><h2 className={`${display} text-[21px] font-black tracking-[-.025em] text-[#faf8f5]`}>Meta Quest 3 512GB</h2><span className={`${display} mt-2 inline-block rounded-full bg-[#222] px-2 py-1 text-[10px] font-bold tracking-[.12em] text-[#888]`}>USED</span></div><strong className={`${display} text-[28px] font-black tracking-[-.04em] text-[#faf8f5]`}>$550</strong></div><div className="mt-5 grid grid-cols-2 gap-2">{fields.map(([label, value]) => <div key={label} className="rounded-xl bg-[#222] px-3 py-3"><p className={`${display} text-[9px] font-bold tracking-[.11em] text-[#888]`}>{label}</p><p className={`${body} mt-1 text-[14px] font-semibold text-[#faf8f5]`}>{value}</p></div>)}</div></div></section><div className="mt-4 space-y-2"><PrimaryButton onClick={() => go("analysing")}>Looks right <ArrowRight size={18} /></PrimaryButton><button onClick={() => go("home")} className={`${display} w-full rounded-2xl border border-white/15 py-3.5 text-[15px] font-bold text-[#faf8f5]`}>Fix product details</button></div></div>;
}

function Analysing({ progress }: { progress: number }) {
  const steps = ["Finding current eBay Australia listings", "Checking listing quality", "Calculating a fair offer", "Assessing this listing"];
  return <div className="flex min-h-full flex-col px-6 pb-9 pt-5"><BrandMark /><main className="flex flex-1 flex-col justify-center"><h1 className={`${display} text-[42px] font-black leading-[.98] tracking-[-.04em] text-[#faf8f5]`}>Sussing it<br /><span className="text-[#c6ff00]">out…</span></h1><div className="mt-4"><ListingLine /></div><div className="mt-14 space-y-5">{steps.map((step, index) => { const complete = index < progress; const active = index === progress; return <div className="flex items-center gap-4" key={step}><span className={`grid size-8 place-items-center rounded-full border ${complete ? "border-[#c6ff00] bg-[#c6ff00] text-[#111]" : active ? "border-2 border-[#c6ff00] text-[#c6ff00]" : "border-white/15 text-transparent"}`}>{complete ? <Check size={15} strokeWidth={3} /> : active ? <span className="size-2 animate-pulse rounded-full bg-[#c6ff00]" /> : ""}</span><span className={`${body} text-[16px] ${complete || active ? "font-medium text-[#faf8f5]" : "text-[#888]"}`}>{step}</span></div>;})}</div></main></div>;
}

function Result({ go }: { go: (s: Screen) => void }) {
  return <div className="px-6 pb-9 pt-5"><Header detail="RESULT" /><ListingLine /><main className="pt-10"><p className={`${display} text-[11px] font-bold tracking-[.16em] text-[#c6ff00]`}>OUR READ</p><h1 className={`${display} mt-2 text-[64px] font-black leading-[.84] tracking-[-.075em] text-[#c6ff00]`}>GOOD<br />BUY</h1><p className={`${body} mt-6 max-w-[300px] text-[15px] leading-6 text-[#888]`}>At $550, this sits within the range of similar current eBay Australia listings.</p><div className="mt-10"><p className={`${display} text-[11px] font-bold tracking-[.14em] text-[#888]`}>SUGGESTED OFFER</p><p className={`${display} mt-1 text-[42px] font-black leading-none tracking-[-.05em] text-[#faf8f5]`}>$485</p><p className={`${display} mt-8 text-[11px] font-bold tracking-[.14em] text-[#888]`}>CURRENT ASKING COMPARABLES</p><p className={`${display} mt-1 text-[30px] font-black leading-none tracking-[-.04em] text-[#faf8f5]`}>$520–580</p><p className={`${body} mt-2 text-[12px] leading-5 text-[#888]`}>Based on current eBay Australia asking prices — not sold-price data.</p></div><div className="mt-9 grid grid-cols-2 gap-7 border-t border-white/10 pt-5"><div><p className={`${display} text-[10px] font-bold tracking-[.14em] text-[#888]`}>DEAL SCORE</p><p className={`${display} mt-1 text-[23px] font-black text-[#faf8f5]`}>8.1 <span className="text-[13px] text-[#888]">/ 10</span></p></div><div><p className={`${display} text-[10px] font-bold tracking-[.14em] text-[#888]`}>CONFIDENCE</p><p className={`${display} mt-1 text-[23px] font-black text-[#faf8f5]`}>Medium</p></div></div><div className="mt-6"><TextButton onClick={() => go("offer")}><span className="flex items-center gap-3"><MessageCircle size={19} className="text-[#c6ff00]" />Make an offer</span></TextButton><TextButton onClick={() => go("comparables")}><span className="flex items-center gap-3"><Search size={19} className="text-[#c6ff00]" />View comparisons</span></TextButton><TextButton onClick={() => go("risks")}><span className="flex items-center gap-3"><ShieldCheck size={19} className="text-[#c6ff00]" />What to check</span></TextButton></div></main></div>;
}

function Comparables({ go }: { go: (s: Screen) => void }) {
  const comps = [["Meta Quest 3 512GB + controllers", "$520", "Current eBay Australia listing"], ["Meta Quest 3 512GB, used", "$549", "Current eBay Australia listing"], ["Meta Quest 3 512GB + case", "$580", "Current eBay Australia listing"]];
  return <div className="px-6 pb-9 pt-5"><Header back={() => go("result")} detail="COMPS" /><h1 className={`${display} text-[33px] font-black leading-none tracking-[-.04em] text-[#faf8f5]`}>Current listings</h1><p className={`${body} mt-3 max-w-[320px] text-[14px] leading-5 text-[#888]`}>These are current asking prices on eBay Australia. They indicate market positioning, not completed sale values.</p><div className="mt-8 border-t border-white/10">{comps.map(([title, price, source]) => <article key={price} className="border-b border-white/10 py-5"><div className="flex items-start justify-between gap-4"><div><p className={`${body} text-[15px] font-medium leading-5 text-[#faf8f5]`}>{title}</p><p className={`${body} mt-2 text-[12px] text-[#888]`}>{source}</p></div><strong className={`${display} shrink-0 text-[22px] font-black tracking-[-.03em] text-[#faf8f5]`}>{price}</strong></div></article>)}</div><div className="mt-8 border-l-2 border-[#c6ff00] pl-4"><p className={`${display} text-[10px] font-bold tracking-[.14em] text-[#c6ff00]`}>READING THE RANGE</p><p className={`${body} mt-2 text-[14px] leading-5 text-[#888]`}>The $550 asking price is in the middle of the current $520–580 range. Condition and included accessories still matter.</p></div></div>;
}

function Offer({ go, copied, copy }: { go: (s: Screen) => void; copied: boolean; copy: () => void }) {
  const message = "Hey mate, definitely interested. Would you take $485 if I can pick it up today?";
  return <div className="px-6 pb-9 pt-5"><Header back={() => go("result")} detail="OFFER" /><h1 className={`${display} text-[33px] font-black leading-none tracking-[-.04em] text-[#faf8f5]`}>Make an offer</h1><p className={`${body} mt-3 text-[15px] leading-6 text-[#888]`}>A $485 offer gives you room to start below the $550 asking price while still being clear and ready to act.</p><section className="mt-9 rounded-[22px] border border-white/10 bg-[#1a1a1a] p-5"><div className="flex items-center gap-2"><Tag size={16} className="text-[#c6ff00]" /><span className={`${display} text-[10px] font-bold tracking-[.14em] text-[#888]`}>SUGGESTED OFFER</span></div><p className={`${display} mt-2 text-[40px] font-black tracking-[-.05em] text-[#faf8f5]`}>$485</p><div className="my-5 h-px bg-white/10" /><p className={`${body} text-[16px] leading-7 text-[#faf8f5]`}>{message}</p></section><button onClick={copy} className={`${display} mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-4 text-[15px] font-bold text-[#faf8f5] transition hover:border-[#c6ff00] hover:text-[#c6ff00]`}>{copied ? <><CheckCircle2 size={18} className="text-[#c6ff00]" />Copied</> : <><Copy size={17} />Copy message</>}</button></div>;
}

function Risks({ go }: { go: (s: Screen) => void }) {
  const risks = [["Inspect the lenses", "Look for scratches, haze or sun damage before payment."], ["Test both controllers", "Check tracking, buttons, triggers and battery contacts."], ["Check the headset charge", "Make sure it powers on, charges and holds connection."], ["Confirm the serial number", "Match the headset and box, and ask about proof of purchase."]];
  return <div className="px-6 pb-9 pt-5"><Header back={() => go("result")} detail="CHECK" /><h1 className={`${display} text-[33px] font-black leading-none tracking-[-.04em] text-[#faf8f5]`}>What to check</h1><p className={`${body} mt-3 text-[15px] leading-6 text-[#888]`}>A good price only matters if the headset is in good nick.</p><div className="mt-8">{risks.map(([title, description], index) => <div key={title} className="flex gap-4 border-b border-white/10 py-5"><span className={`${display} mt-0.5 text-[12px] font-black text-[#c6ff00]`}>0{index + 1}</span><div><h2 className={`${display} text-[18px] font-extrabold text-[#faf8f5]`}>{title}</h2><p className={`${body} mt-1 text-[13px] leading-5 text-[#888]`}>{description}</p></div></div>)}</div><div className="mt-7 flex gap-3 border-l-2 border-[#c6ff00] pl-4"><CircleAlert size={18} className="mt-0.5 shrink-0 text-[#c6ff00]" /><p className={`${body} text-[13px] leading-5 text-[#888]`}>If the seller won&apos;t let you test it, factor that uncertainty into your offer.</p></div></div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (screen !== "analysing") return; setProgress(0); let current = 0; const timer = window.setInterval(() => { current += 1; setProgress(current); if (current === 4) { window.clearInterval(timer); window.setTimeout(() => setScreen("result"), 550); } }, 850); return () => window.clearInterval(timer); }, [screen]);
  const copy = () => { navigator.clipboard?.writeText("Hey mate, definitely interested. Would you take $485 if I can pick it up today?"); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const content = screen === "home" ? <Home go={setScreen} /> : screen === "confirm" ? <Confirm go={setScreen} /> : screen === "analysing" ? <Analysing progress={progress} /> : screen === "result" ? <Result go={setScreen} /> : screen === "comparables" ? <Comparables go={setScreen} /> : screen === "offer" ? <Offer go={setScreen} copied={copied} copy={copy} /> : <Risks go={setScreen} />;
  return <div className={`${body} min-h-screen bg-[#faf8f5] text-[#faf8f5] sm:grid sm:place-items-center sm:p-6`}><div className="relative min-h-screen w-full overflow-hidden bg-[#111] sm:min-h-0 sm:max-w-[390px] sm:rounded-[42px] sm:shadow-2xl"><div className="absolute right-7 top-3 z-10 flex items-center gap-1 text-[10px] font-semibold text-[#faf8f5]/80"><span className="mr-1">9:41</span><span className="h-2 w-3 rounded-sm border border-white/50"><span className="block h-full w-2/3 rounded-sm bg-[#c6ff00]" /></span></div><div className="min-h-screen overflow-y-auto pt-6 sm:max-h-[844px] sm:min-h-[844px]">{content}</div><div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/20" /></div></div>;
}
