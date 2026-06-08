"use client";
import { useState, FormEvent, useRef, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/router";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { cubicBezier } from "motion/react";
import { Loader2Icon, ShieldCheckIcon, ArrowLeftIcon, SmartphoneIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type View = "login" | "register" | "otp";

// ── OTP Input ─────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !e.currentTarget.value && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[i] = digit;
    const next = arr.join("").padEnd(6, "").slice(0, 6);
    onChange(next.trimEnd());
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-14 text-center text-xl font-bold bg-white dark:bg-neutral-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-0 focus:border-blue-500 outline-none transition-colors text-zinc-900 dark:text-white"
        />
      ))}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({
  label, id, type = "text", value, onChange, placeholder, autoComplete, required = true, hint,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; required?: boolean; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900 dark:text-white mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id} type={isPassword ? (show ? "text" : "password") : type}
          autoComplete={autoComplete} required={required} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 pr-10"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            {show ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [view, setView]     = useState<View>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [regEmail, setRegEmail]   = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm]   = useState("");
  const [phone, setPhone]             = useState("");

  // OTP step
  const [otp, setOtp]         = useState("");
  const [otpPhone, setOtpPhone] = useState(""); // formatted phone returned by API

  const reset = () => { setError(null); setSuccess(null); };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); reset();
    setLoading(true);
    try {
      const data = await authApi.login(loginEmail, loginPassword);
      if (data.token) {
        localStorage.setItem("vtc_token", data.token);
        document.cookie = `vtc_token=${data.token}; path=/; max-age=86400`;
        setUser(data.user);
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally { setLoading(false); }
  };

  // ── Register → send OTP ───────────────────────────────────────────────────
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault(); reset();
    if (regPassword !== regConfirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (regPassword.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    setLoading(true);
    try {
      const data = await authApi.sendOtp({
        email: regEmail,
        password: regPassword,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: "gestionnaire"
      });
      setOtpPhone(data.phone ?? phone);
      setSuccess(`Code envoyé au ${data.phone ?? phone}`);
      setView("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally { setLoading(false); }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault(); reset();
    if (otp.length < 6) { setError("Entrez le code à 6 chiffres."); return; }
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(otpPhone, otp);
      if (data.token) {
        localStorage.setItem("vtc_token", data.token);
        document.cookie = `vtc_token=${data.token}; path=/; max-age=86400`;
        setUser(data.user);
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally { setLoading(false); }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    reset(); setLoading(true);
    try {
      await authApi.sendOtp({
        email: regEmail,
        password: regPassword,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: "gestionnaire"
      });
      setResendCooldown(60);
      setSuccess("Nouveau code envoyé !");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally { setLoading(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 min-h-screen flex justify-center items-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">

          {/* ── LOGIN ── */}
          {view === "login" && (
            <motion.div key="login"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: cubicBezier(0.4, 0, 0.2, 1) }}
              className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-2xl shadow-sm dark:border border-border"
            >
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <ShieldCheckIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm tracking-wide">VTC Pro · Espace Gestionnaire</span>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Connexion</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Accédez à votre tableau de bord.</p>

              {error && <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{error}</div>}

              <form onSubmit={handleLogin} className="space-y-5">
                <Field label="Adresse e-mail" id="email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="gestionnaire@vtcpro.fr" autoComplete="email" />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-900 dark:text-white">Mot de passe</label>
                    <button type="button" onClick={() => { reset(); /* future: forgot password */ }} className="text-xs text-blue-500 hover:underline">Mot de passe oublié ?</button>
                  </div>
                  <Field label="" id="password" type="password" value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" autoComplete="current-password" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors text-sm">
                  {loading ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Connexion…</> : "Se connecter"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Pas encore de compte ?</p>
                <button onClick={() => { reset(); setView("register"); }}
                  className="text-sm font-medium text-blue-600 hover:underline">
                  Créer un compte gestionnaire
                </button>
              </div>
            </motion.div>
          )}

          {/* ── REGISTER ── */}
          {view === "register" && (
            <motion.div key="register"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: cubicBezier(0.4, 0, 0.2, 1) }}
              className="bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-2xl shadow-sm dark:border border-border"
            >
              <button onClick={() => { reset(); setView("login"); }} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 mb-6">
                <ArrowLeftIcon className="w-4 h-4" /> Retour à la connexion
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <ShieldCheckIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm tracking-wide">VTC Pro · Espace Gestionnaire</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Créer un compte</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Votre numéro de téléphone sera vérifié par SMS.</p>

              {error   && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600">{error}</div>}
              {success && <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600">{success}</div>}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" id="first_name" value={firstName} onChange={setFirstName} placeholder="Jean" autoComplete="given-name" />
                  <Field label="Nom" id="last_name" value={lastName} onChange={setLastName} placeholder="Dupont" autoComplete="family-name" />
                </div>
                <Field label="Adresse e-mail" id="reg_email" type="email" value={regEmail} onChange={setRegEmail} placeholder="jean@vtcpro.fr" autoComplete="email" />
                <Field label="Numéro de téléphone" id="phone" value={phone} onChange={setPhone}
                  placeholder="+33 6 12 34 56 78" autoComplete="tel"
                  hint="Un code de vérification à 6 chiffres sera envoyé par SMS." />
                <Field label="Mot de passe" id="reg_password" type="password" value={regPassword} onChange={setRegPassword}
                  placeholder="••••••••" hint="Minimum 8 caractères." autoComplete="new-password" />
                <Field label="Confirmer le mot de passe" id="reg_confirm" type="password" value={regConfirm} onChange={setRegConfirm}
                  placeholder="••••••••" autoComplete="new-password" />

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors text-sm mt-2">
                  {loading ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Envoi du code…</> : "Recevoir le code par SMS"}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── OTP ── */}
          {view === "otp" && (
            <motion.div key="otp"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: cubicBezier(0.4, 0, 0.2, 1) }}
              className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-2xl shadow-sm dark:border border-border"
            >
              <button onClick={() => { reset(); setView("register"); }} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 mb-6">
                <ArrowLeftIcon className="w-4 h-4" /> Modifier les informations
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <SmartphoneIcon className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Vérification SMS</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Un code à 6 chiffres a été envoyé au<br />
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{otpPhone}</span>
                </p>
              </div>

              {error   && <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600">{error}</div>}
              {success && <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 flex items-center gap-2"><CheckCircle2Icon className="w-4 h-4" />{success}</div>}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <OtpInput value={otp} onChange={setOtp} />

                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors text-sm">
                  {loading ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Vérification…</> : "Confirmer et créer mon compte"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-zinc-400 mb-2">Vous n&apos;avez pas reçu le SMS ?</p>
                <button onClick={handleResend} disabled={resendCooldown > 0 || loading}
                  className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline">
                  {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
