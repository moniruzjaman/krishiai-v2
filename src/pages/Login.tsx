import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Sprout, Mail, Lock, Phone, MapPin, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/useAuthStore"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { BD_DISTRICTS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { supabase } from "@/services/supabaseClient"

type AuthTab = "login" | "signup"
type LoginMethod = "email" | "phone" | "google"
type OtpStep = "phone" | "otp"

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithPhone, verifyOtp, loading, supabaseAvailable } = useAuthStore()
  const { district, upazila, setDistrict, setUpazila } = useLocationStore()
  const { language } = useSettingsStore()

  const [tab, setTab] = useState<AuthTab>("login")
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email")
  const [otpStep, setOtpStep] = useState<OtpStep>("phone")

  // Login fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Signup fields
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")
  const [signUpPhone, setSignUpPhone] = useState("")
  const [signUpDistrict, setSignUpDistrict] = useState(district || "")
  const [signUpUpazila, setSignUpUpazila] = useState(upazila || "")

  // Error
  const [error, setError] = useState("")

  // ── Auto-detect device email (best-effort) ──
  // Web browsers don't expose device email for privacy,
  // but we can auto-fill from the auth session if returning user.
  // Google One Tap / OAuth is the proper way to "auto-detect Gmail".
  useEffect(() => {
    // Check if there's a saved email hint in localStorage
    try {
      const savedEmail = localStorage.getItem("krishiai-email-hint")
      if (savedEmail && !email) {
        setEmail(savedEmail)
      }
    } catch {
      // localStorage unavailable
    }
  }, [])

  // Pre-fill district/upazila from location store
  useEffect(() => {
    if (district) setSignUpDistrict(district)
    if (upazila) setSignUpUpazila(upazila)
  }, [district, upazila])

  // ── Login handlers ──
  const handleEmailLogin = async () => {
    setError("")
    if (!email || !password) {
      setError(language === "bn" ? "ইমেইল ও পাসওয়ার্ড দিন" : "Enter email and password")
      return
    }
    try {
      await signIn(email, password)
      // Save email hint for next time
      try { localStorage.setItem("krishiai-email-hint", email) } catch {}
      navigate("/")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg.includes("Invalid") ? (language === "bn" ? "ভুল ইমেইল বা পাসওয়ার্ড" : "Invalid email or password") : msg)
    }
  }

  const handlePhoneOtpRequest = async () => {
    setError("")
    if (!phone) {
      setError(language === "bn" ? "ফোন নম্বর দিন" : "Enter phone number")
      return
    }
    try {
      await signInWithPhone(phone)
      setOtpStep("otp")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP"
      setError(msg)
    }
  }

  const handleOtpVerify = async () => {
    setError("")
    if (!otpCode || otpCode.length !== 6) {
      setError(language === "bn" ? "৬ সংখ্যার ওটিপি কোড দিন" : "Enter 6-digit OTP code")
      return
    }
    try {
      await verifyOtp(phone, otpCode)
      navigate("/")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed"
      setError(language === "bn" ? "ওটিপি যাচাই ব্যর্থ" : "OTP verification failed")
    }
  }

  // ── Google OAuth Sign-In ──
  const handleGoogleSignIn = async () => {
    setError("")
    if (!supabase) {
      setError(language === "bn" ? "অথেনটিকেশন সার্ভিস কনফিগার করা হয়নি" : "Auth service not configured")
      return
    }
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (oauthError) throw oauthError
      // OAuth will redirect — no need to navigate
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed"
      setError(msg)
    }
  }

  // ── Signup handler ──
  const handleSignUp = async () => {
    setError("")
    if (!signUpEmail || !signUpPassword) {
      setError(language === "bn" ? "ইমেইল ও পাসওয়ার্ড দিন" : "Enter email and password")
      return
    }
    if (signUpPassword.length < 6) {
      setError(language === "bn" ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters")
      return
    }
    try {
      await signUp(signUpEmail, signUpPassword, signUpPhone || undefined)
      if (signUpDistrict) setDistrict(signUpDistrict)
      if (signUpUpazila) setUpazila(signUpUpazila)
      // Save email hint
      try { localStorage.setItem("krishiai-email-hint", signUpEmail) } catch {}
      navigate("/")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed"
      setError(msg.includes("already") ? (language === "bn" ? "এই ইমেইল আগে থেকেই আছে" : "Email already exists") : msg)
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center p-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground self-start"
      >
        <ArrowLeft className="h-4 w-4" />
        {language === "bn" ? "পিছনে" : "Back"}
      </button>

      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg mb-3">
          <Sprout className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          কৃষি <span className="text-primary-600">AI</span>
        </h1>
      </div>

      <Card className="w-full max-w-md">
        {/* Supabase not configured notice */}
        {!supabaseAvailable && (
          <div className="mx-4 mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            {language === "bn"
              ? "⚠️ অথেনটিকেশন সার্ভিস কনফিগার করা হয়নি। অতিথি হিসেবে ব্যবহার করুন।"
              : "⚠️ Auth service not configured. Use as guest."}
          </div>
        )}
        <CardHeader className="pb-2">
          {/* Tab selector */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-all",
                tab === "login"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {language === "bn" ? "লগইন" : "Login"}
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-all",
                tab === "signup"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {language === "bn" ? "নিবন্ধন" : "Sign Up"}
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Google Sign-In Button (always visible at top) ── */}
          {supabaseAvailable && (
            <Button
              variant="outline"
              className="w-full flex items-center gap-3 border-gray-300 bg-white hover:bg-gray-50"
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {language === "bn" ? "Google দিয়ে লগইন" : "Continue with Google"}
              </span>
            </Button>
          )}

          {/* Divider */}
          {supabaseAvailable && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {language === "bn" ? "অথবা" : "or"}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* ── Login Form ── */}
          {tab === "login" && (
            <>
              {/* Method toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setLoginMethod("email"); setError(""); }}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    loginMethod === "email"
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-border bg-white text-muted-foreground"
                  )}
                >
                  <Mail className="inline h-3.5 w-3.5 mr-1" />
                  {language === "bn" ? "ইমেইল" : "Email"}
                </button>
                <button
                  onClick={() => { setLoginMethod("phone"); setError(""); setOtpStep("phone"); }}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    loginMethod === "phone"
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-border bg-white text-muted-foreground"
                  )}
                >
                  <Phone className="inline h-3.5 w-3.5 mr-1" />
                  {language === "bn" ? "ফোন + ওটিপি" : "Phone + OTP"}
                </button>
              </div>

              {/* Email login */}
              {loginMethod === "email" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder={language === "bn" ? "ইমেইল ঠিকানা" : "Email address"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      dir="ltr"
                      autoComplete="email"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={language === "bn" ? "পাসওয়ার্ড" : "Password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      dir="ltr"
                      autoComplete="current-password"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={handleEmailLogin}
                    disabled={loading || !supabaseAvailable}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (language === "bn" ? "লগইন হচ্ছে..." : "Logging in...") : (language === "bn" ? "লগইন" : "Login")}
                  </Button>
                </div>
              )}

              {/* Phone + OTP login */}
              {loginMethod === "phone" && (
                <div className="space-y-3">
                  {otpStep === "phone" ? (
                    <>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder={language === "bn" ? "ফোন নম্বর (+৮৮০)" : "Phone number (+880)"}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                          dir="ltr"
                          autoComplete="tel"
                        />
                      </div>
                      <Button
                        onClick={handlePhoneOtpRequest}
                        disabled={loading || !supabaseAvailable}
                        className="w-full"
                        size="lg"
                      >
                        {loading
                          ? (language === "bn" ? "ওটিপি পাঠানো হচ্ছে..." : "Sending OTP...")
                          : (language === "bn" ? "ওটিপি পাঠান" : "Send OTP")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground text-center">
                        {language === "bn"
                          ? `${phone} নম্বরে ওটিপি পাঠানো হয়েছে`
                          : `OTP sent to ${phone}`}
                      </p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={language === "bn" ? "৬ সংখ্যার ওটিপি কোড" : "6-digit OTP code"}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="text-center text-2xl tracking-[0.5em] font-bold"
                        dir="ltr"
                      />
                      <Button
                        onClick={handleOtpVerify}
                        disabled={loading || otpCode.length !== 6 || !supabaseAvailable}
                        className="w-full"
                        size="lg"
                      >
                        {loading
                          ? (language === "bn" ? "যাচাই হচ্ছে..." : "Verifying...")
                          : (language === "bn" ? "ওটিপি যাচাই করুন" : "Verify OTP")}
                      </Button>
                      <button
                        onClick={() => { setOtpStep("phone"); setOtpCode(""); setError(""); }}
                        className="w-full text-center text-xs text-primary-600 hover:underline"
                      >
                        {language === "bn" ? "ফোন নম্বর পরিবর্তন করুন" : "Change phone number"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Sign Up Form ── */}
          {tab === "signup" && (
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={language === "bn" ? "ইমেইল ঠিকানা" : "Email address"}
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="pl-10"
                  dir="ltr"
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={language === "bn" ? "পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)" : "Password (min 6 chars)"}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="pl-10 pr-10"
                  dir="ltr"
                  autoComplete="new-password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder={language === "bn" ? "ফোন নম্বর (ঐচ্ছিক)" : "Phone number (optional)"}
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  className="pl-10"
                  dir="ltr"
                  autoComplete="tel"
                />
              </div>
              {/* District — pre-filled from GPS */}
              <select
                value={signUpDistrict}
                onChange={(e) => setSignUpDistrict(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{language === "bn" ? "জেলা নির্বাচন করুন" : "Select District"}</option>
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {/* Upazila — pre-filled from GPS */}
              <Input
                type="text"
                placeholder={language === "bn" ? "উপজেলা (স্বয়ংক্রিয়ভাবে পূরণ হবে)" : "Upazila (auto-filled from GPS)"}
                value={signUpUpazila}
                onChange={(e) => setSignUpUpazila(e.target.value)}
                dir="auto"
              />
              {district && (
                <p className="text-[10px] text-green-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {language === "bn" ? "আপনার অবস্থান থেকে স্বয়ংক্রিয়ভাবে পূরণ হয়েছে" : "Auto-filled from your location"}
                </p>
              )}
              <Button
                onClick={handleSignUp}
                disabled={loading || !supabaseAvailable}
                className="w-full"
                size="lg"
              >
                {loading
                  ? (language === "bn" ? "নিবন্ধন হচ্ছে..." : "Signing up...")
                  : (language === "bn" ? "নিবন্ধন করুন" : "Sign Up")}
              </Button>
            </div>
          )}

          {/* Guest link */}
          <div className="pt-2 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-primary-600 hover:underline"
            >
              {language === "bn" ? "অতিথি হিসেবে চালিয়ে যান" : "Continue as Guest"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
