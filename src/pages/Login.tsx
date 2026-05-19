import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Sprout, Mail, Lock, Phone, MapPin, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/useAuthStore"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { KURIGRAM_UPAZILAS, BD_DISTRICTS } from "@/lib/constants"
import { cn } from "@/lib/utils"

type AuthTab = "login" | "signup"
type LoginMethod = "email" | "phone"
type OtpStep = "phone" | "otp"

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithPhone, verifyOtp, loading, supabaseAvailable } = useAuthStore()
  const { setDistrict, setUpazila } = useLocationStore()
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
  const [signUpDistrict, setSignUpDistrict] = useState("")
  const [signUpUpazila, setSignUpUpazila] = useState("")

  // Error
  const [error, setError] = useState("")

  // ── Login handlers ──
  const handleEmailLogin = async () => {
    setError("")
    if (!email || !password) {
      setError(language === "bn" ? "ইমেইল ও পাসওয়ার্ড দিন" : "Enter email and password")
      return
    }
    try {
      await signIn(email, password)
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
                />
              </div>
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
              <select
                value={signUpUpazila}
                onChange={(e) => setSignUpUpazila(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{language === "bn" ? "উপজেলা নির্বাচন করুন" : "Select Upazila"}</option>
                {KURIGRAM_UPAZILAS.map((uz) => (
                  <option key={uz} value={uz}>{uz}</option>
                ))}
              </select>
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
