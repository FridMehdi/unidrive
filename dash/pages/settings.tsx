"use client";

import { useState, useEffect, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  UserIcon, ShieldIcon, BellIcon, PaletteIcon,
  SaveIcon, Loader2Icon, CheckCircleIcon, XCircleIcon,
  EyeIcon, EyeOffIcon, SunIcon, MoonIcon, MonitorIcon,
} from "lucide-react";
import { userApi, authApi, getToken } from "@/lib/api";

type AlertState = { type: "success" | "error"; message: string } | null;

function Alert({ state, onClose }: { state: AlertState; onClose: () => void }) {
  if (!state) return null;
  const ok = state.type === "success";
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border ${ok ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"}`}>
      {ok ? <CheckCircleIcon className="w-4 h-4 flex-shrink-0" /> : <XCircleIcon className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{state.message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-6 border-b border-border">
      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <h2 className="font-semibold text-sm">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState<AlertState>(null);

  // ── Phone OTP ───────────────────────────────────────────────────────────
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput]     = useState("");
  const [otpStep, setOtpStep]       = useState(false);
  const [phoneSending, setPhoneSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneAlert, setPhoneAlert] = useState<AlertState>(null);

  // ── Password ─────────────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdAlert, setPwdAlert] = useState<AlertState>(null);

  // ── Appearance (localStorage) ─────────────────────────────────────────────
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // ── Load profile + preferences on mount ──────────────────────────────────
  useEffect(() => {
    const savedTheme = (localStorage.getItem("vtc_theme") as "light" | "dark" | "system") ?? "system";
    setTheme(savedTheme);

    const token = getToken();
    if (!token) { setProfileLoading(false); return; }

    authApi.me()
      .then((data) => {
        const u = data.user ?? data;
        setProfile({
          first_name: u.first_name ?? "",
          last_name:  u.last_name  ?? "",
          email:      u.email      ?? "",
          phone:      u.phone      ?? "",
          role:       u.role       ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // ── Apply theme to DOM ────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else if (theme === "light") root.classList.remove("dark");
    else {
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? root.classList.add("dark")
        : root.classList.remove("dark");
    }
    localStorage.setItem("vtc_theme", theme);
  }, [theme]);

  // ── Send phone OTP ─────────────────────────────────────────────────────────
  const handleSendPhoneOtp = async () => {
    setPhoneAlert(null);
    setPhoneSending(true);
    try {
      const data = await userApi.sendPhoneOtp();
      setOtpStep(true);
      setPhoneAlert({ type: "success", message: data.message ?? "Code envoyé avec succès" });
    } catch (err: unknown) {
      setPhoneAlert({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setPhoneSending(false);
    }
  };

  // ── Verify phone OTP ──────────────────────────────────────────────────────
  const handleVerifyPhoneOtp = async () => {
    setPhoneAlert(null);
    setOtpVerifying(true);
    try {
      const data = await userApi.verifyPhoneOtp(otpInput);
      setProfile((p) => ({ ...p, phone: phoneInput }));
      setPhoneAlert({ type: "success", message: data.message ?? "Numéro vérifié avec succès" });
      setOtpStep(false);
      setPhoneInput("");
      setOtpInput("");
    } catch (err: unknown) {
      setPhoneAlert({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setOtpVerifying(false);
    }
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileAlert(null);
    setProfileSaving(true);
    try {
      await userApi.updateMe({ first_name: profile.first_name, last_name: profile.last_name });
      setProfileAlert({ type: "success", message: "Profil mis à jour avec succès." });
    } catch (err: unknown) {
      setProfileAlert({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Save password ─────────────────────────────────────────────────────────
  const handlePasswordSave = async (e: FormEvent) => {
    e.preventDefault();
    setPwdAlert(null);
    if (pwd.new_password !== pwd.confirm) {
      setPwdAlert({ type: "error", message: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }
    if (pwd.new_password.length < 8) {
      setPwdAlert({ type: "error", message: "Le mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    setPwdSaving(true);
    try {
      await userApi.changePassword({ current_password: pwd.current_password, new_password: pwd.new_password });
      setPwd({ current_password: "", new_password: "", confirm: "" });
      setPwdAlert({ type: "success", message: "Mot de passe modifié avec succès." });
    } catch (err: unknown) {
      setPwdAlert({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Sub-components ────────────────────────────────────────────────────────
  const PwdField = ({ id, label, field }: { id: keyof typeof showPwd; label: string; field: keyof typeof pwd }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        <Input
          type={showPwd[id] ? "text" : "password"}
          value={pwd[field]}
          onChange={(e) => setPwd((p) => ({ ...p, [field]: e.target.value }))}
          placeholder="••••••••"
          className="pr-10"
        />
        <button type="button"
          onClick={() => setShowPwd((s) => ({ ...s, [id]: !s[id] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {showPwd[id] ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const ThemeBtn = ({ value, icon: Icon, label }: { value: typeof theme; icon: React.ElementType; label: string }) => (
    <button type="button" onClick={() => setTheme(value)}
      className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border text-xs font-medium transition-all ${
        theme === value
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
          : "border-border text-muted-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900"
      }`}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-lg font-bold">Paramétrage</h1>
          <p className="text-xs text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-6 space-y-5">

        {/* ── Profil ── */}
        <Card className="border-none shadow-sm p-6">
          <SectionHeader icon={UserIcon} title="Informations personnelles" subtitle="Modifiez vos informations de profil" />
          {profileLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <Alert state={profileAlert} onClose={() => setProfileAlert(null)} />
              {profile.role && (
                <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-medium capitalize">
                  <ShieldIcon className="w-3 h-3" />
                  {profile.role === "gestionnaire" ? "Gestionnaire" : profile.role === "chauffeur" ? "Chauffeur" : profile.role}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Prénom</label>
                  <Input value={profile.first_name} onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))} placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nom</label>
                  <Input value={profile.last_name} onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))} placeholder="Dupont" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Adresse e-mail</label>
                <Input value={profile.email} disabled className="opacity-60 cursor-not-allowed" placeholder="email@vtcpro.fr" />
                <p className="text-xs text-muted-foreground mt-1">L&apos;e-mail ne peut pas être modifié ici.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Téléphone</label>
                {profile.phone ? (
                  <>
                    <Input value={profile.phone} disabled className="opacity-60 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground mt-1">Pour modifier votre numéro, contactez l&apos;administrateur.</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Alert state={phoneAlert} onClose={() => setPhoneAlert(null)} />
                    {!otpStep ? (
                      <div className="flex gap-2">
                        <Input
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={phoneSending || !phoneInput.trim()}
                          onClick={handleSendPhoneOtp}
                          className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                        >
                          {phoneSending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Envoyer le code"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Code envoyé par SMS. Saisissez-le ci-dessous.</p>
                        <div className="flex gap-2">
                          <Input
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            className="flex-1 tracking-widest text-center text-lg font-mono"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={otpVerifying || otpInput.length < 4}
                            onClick={handleVerifyPhoneOtp}
                            className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                          >
                            {otpVerifying ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Vérifier"}
                          </Button>
                        </div>
                        <button type="button" onClick={() => { setOtpStep(false); setOtpInput(""); setPhoneAlert(null); }} className="text-xs text-muted-foreground underline">
                          Changer de numéro
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={profileSaving} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                  {profileSaving
                    ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Sauvegarde…</>
                    : <><SaveIcon className="w-4 h-4" /> Enregistrer</>}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* ── Sécurité ── */}
        <Card className="border-none shadow-sm p-6">
          <SectionHeader icon={ShieldIcon} title="Sécurité" subtitle="Modifiez votre mot de passe" />
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Alert state={pwdAlert} onClose={() => setPwdAlert(null)} />
            <PwdField id="current" label="Mot de passe actuel" field="current_password" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PwdField id="next"    label="Nouveau mot de passe" field="new_password" />
              <PwdField id="confirm" label="Confirmer"            field="confirm" />
            </div>
            {pwd.new_password && (
              <div>
                <div className="flex gap-1">
                  {[8, 12, 16].map((len, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      pwd.new_password.length >= len
                        ? ["bg-red-400", "bg-amber-400", "bg-green-500"][i]
                        : "bg-neutral-200 dark:bg-neutral-700"
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pwd.new_password.length < 8 ? "Trop court (min. 8 car.)" : pwd.new_password.length < 12 ? "Faible" : pwd.new_password.length < 16 ? "Moyen" : "Fort"}
                </p>
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={pwdSaving} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                {pwdSaving
                  ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Modification…</>
                  : <><SaveIcon className="w-4 h-4" /> Changer le mot de passe</>}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Apparence ── */}
        <Card className="border-none shadow-sm p-6">
          <SectionHeader icon={PaletteIcon} title="Apparence" subtitle="Thème de l'interface" />
          <div className="flex gap-3">
            <ThemeBtn value="light"  icon={SunIcon}     label="Clair" />
            <ThemeBtn value="dark"   icon={MoonIcon}    label="Sombre" />
            <ThemeBtn value="system" icon={MonitorIcon} label="Système" />
          </div>
        </Card>

      </div>
    </>
  );
}
