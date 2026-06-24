'use client';

import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, createContext, Children } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, Mail, Gem, Eye, EyeOff, ArrowLeft, X, AlertCircle, PartyPopper, Loader, User, Phone, AtSign, Check } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
import { AnimatePresence, motion, Variants, Transition } from "framer-motion";
import { createClient } from '@/lib/supabase/client';
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti";
import confetti from "canvas-confetti";

// ——— Confetti ————————————————————————————————————————————————————————————
type Api = { fire: (options?: ConfettiOptions) => void }
export type ConfettiRef = Api | null
// ConfettiContext is exported for potential external use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ConfettiContext = createContext<Api>({} as Api)
const Confetti = forwardRef<ConfettiRef, React.ComponentPropsWithRef<"canvas"> & { options?: ConfettiOptions; globalOptions?: ConfettiGlobalOptions; manualstart?: boolean }>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: false }, manualstart = false, ...rest } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)
  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) { if (instanceRef.current) return; instanceRef.current = confetti.create(node, { ...globalOptions, resize: true }) }
    else { if (instanceRef.current) { instanceRef.current.reset(); instanceRef.current = null } }
  }, [globalOptions])
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
  const api = useMemo(() => ({ fire }), [fire])
  useImperativeHandle(ref, () => api, [api])
  useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
  return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

// ——— TextLoop ————————————————————————————————————————————————————————————
type TextLoopProps = { children: React.ReactNode[]; className?: string; interval?: number; transition?: Transition; variants?: Variants; onIndexChange?: (index: number) => void; stopOnEnd?: boolean; };
export function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) { clearInterval(timer); return current; }
        const next = (current + 1) % items.length; onIndexChange?.(next); return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  const motionVariants: Variants = { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 } };
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial='initial' animate='animate' exit='exit' transition={transition} variants={variants || motionVariants}>{items[currentIndex]}</motion.div>
      </AnimatePresence>
    </div>
  );
}

// ——— GlassButton —————————————————————————————————————————————————————————
const glassButtonVariants = cva("relative isolate all-unset cursor-pointer rounded-full transition-all", { variants: { size: { default: "text-lg font-medium", sm: "text-base font-medium", lg: "text-xl font-medium", icon: "h-12 w-12" } }, defaultVariants: { size: "default" } });
const glassButtonTextVariants = cva("glass-button-text relative block select-none tracking-tighter !text-white", { variants: { size: { default: "px-8 py-4", sm: "px-6 py-3", lg: "px-10 py-5", icon: "flex h-12 w-12 items-center justify-center" } }, defaultVariants: { size: "default" } });
export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> { contentClassName?: string; }
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(({ className, children, size, contentClassName, onClick, ...props }, ref) => {
  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => { const button = e.currentTarget.querySelector('button'); if (button && e.target !== button) button.click(); };
  return (
    <div className={cn("glass-button-wrap cursor-pointer rounded-full relative", className)} onClick={handleWrapperClick}>
      <button className={cn("glass-button relative z-10 w-full flex items-center justify-center", glassButtonVariants({ size }))} ref={ref} onClick={onClick} {...props}>
        <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
      </button>
      <div className="glass-button-shadow rounded-full pointer-events-none"></div>
    </div>
  );
});
GlassButton.displayName = "GlassButton";

// ——— Background & Icons —————————————————————————————————————————————————
const GradientBackground = () => (
  <div className="absolute inset-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-80"></div>
);
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6"><g fillRule="evenodd" fill="none"><g fillRule="nonzero" transform="translate(3, 2)"><path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path><path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path><path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path><path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path></g></g></svg>);

const DefaultLogo = () => (<div className="bg-primary text-primary-foreground rounded-md p-1.5"><Gem className="h-4 w-4" /></div>);

// ——— Modal steps —————————————————————————————————————————————————————
const modalSteps = [
  { message: "Authenticating...", icon: <Loader className="w-16 h-16 text-blue-400 animate-spin" /> },
  { message: "Setting things up...", icon: <Loader className="w-16 h-16 text-blue-400 animate-spin" /> },
  { message: "Finalizing...", icon: <Loader className="w-16 h-16 text-blue-400 animate-spin" /> },
  { message: "Welcome Aboard!", icon: <PartyPopper className="w-16 h-16 text-green-500" /> }
];
const TEXT_LOOP_INTERVAL = 1.5;

// ——— Avatars ——————————————————————————————————————————————————————————
const AVATARS = [
  { id: 'boy-1',  src: '/avatars/boy-1.png',  label: 'Alex' },
  { id: 'girl-1', src: '/avatars/girl-1.png',  label: 'Sarah' },
  { id: 'boy-2',  src: '/avatars/boy-2.png',  label: 'James' },
  { id: 'girl-2', src: '/avatars/girl-2.png',  label: 'Maya' },
  { id: 'boy-3',  src: '/avatars/boy-3.png',  label: 'David' },
  { id: 'girl-3', src: '/avatars/girl-3.png',  label: 'Emma' },
  { id: 'boy-4',  src: '/avatars/boy-4.svg',  label: 'Ryan' },
  { id: 'girl-4', src: '/avatars/girl-4.svg',  label: 'Lily' },
];

// ——— Types ————————————————————————————————————————————————————————————
export interface SignupData {
  email: string; password: string;
  fullName: string; username: string; mobileNumber: string;
  linkedinUrl: string; avatarId: string;
}

interface AuthComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
  onGoogleSignIn?: () => void;
  onEmailSubmit?: (data: SignupData | { email: string; password: string }) => Promise<{ error: string | null; type?: 'check_email' | 'success' } | string | null>;
  onResetPassword?: (email: string) => Promise<string | null>;
  onResendEmail?: (email: string) => Promise<string | null>;
  initialMode?: 'initial' | 'complete' | 'signup' | 'login';
  defaultEmail?: string;
  defaultName?: string;
  pendingVerificationEmail?: string; // Restore check_email popup after page refresh
  isVerified?: boolean;
}

export const GlassInput = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="glass-input-wrap w-full">
    <div className="glass-input p-2">
      <span className="glass-input-text-area"></span>
      <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-12 pl-3">{icon}</div>
      {children}
    </div>
  </div>
);

type Mode = 'initial' | 'login' | 'signup' | 'complete' | 'forgot-password';

// ——— AuthComponent ————————————————————————————————————————————————————
export const AuthComponent = ({ logo = <DefaultLogo />, brandName = "PostForge AI", onGoogleSignIn, onEmailSubmit, onResetPassword, onResendEmail, initialMode = 'initial', defaultEmail = '', defaultName = '', pendingVerificationEmail = '', isVerified = false }: AuthComponentProps) => {
  const [mode, setMode]                       = useState<Mode>(initialMode);
  
  const [avatarId, setAvatarId]               = useState('boy-1');
  const [fullName, setFullName]               = useState(defaultName);
  const [linkedinUrl, setLinkedinUrl]         = useState('');
  const [username] = useState(() => {
    const d = Math.floor(10 + Math.random() * 90);
    const l = 'abcdefghijklmnopqrstuvwxyz';
    const u = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rndL = () => l[Math.floor(Math.random() * 26)];
    const rndU = () => u[Math.floor(Math.random() * 26)];
    return `User_${d}${rndL()}${rndL()}${rndU()}${rndU()}`;
  });
  const [mobileNumber, setMobileNumber]       = useState('');
  const [email, setEmail]                     = useState(pendingVerificationEmail || defaultEmail);
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [modalStatus, setModalStatus]         = useState<'closed' | 'loading' | 'error' | 'success'>(pendingVerificationEmail ? 'success' : 'closed');
  const [modalError, setModalError]           = useState('');
  const [successMessage, setSuccessMessage]   = useState(pendingVerificationEmail ? 'Check your email for the verification link!' : 'Welcome Aboard!');
  const [isCheckEmail, setIsCheckEmail]       = useState(!!pendingVerificationEmail);
  const [resendCooldown, setResendCooldown]   = useState(pendingVerificationEmail ? 30 : 0);
  const [resendMsg, setResendMsg]             = useState('');
  const confettiRef = useRef<ConfettiRef>(null);
  // pollRef and resendTimerRef reserved for future polling/timer logic
  const pollRef = useRef<NodeJS.Timeout | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Auto-poll every 2 minutes when in check_email state — redirect once confirmed
  useEffect(() => {
    if (!isCheckEmail) return;
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        clearInterval(interval);
        window.location.href = '/dashboard';
      }
    }, 2 * 60 * 1000); // 2 minutes
    return () => clearInterval(interval);
  }, [isCheckEmail]);

  // Validations
  const isEmailValid    = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 12; 
  const isConfirmValid  = confirmPassword === password;
  const isNameValid     = fullName.trim().length >= 1;
  const isUserValid     = username.trim().length >= 1;
  const isLinkedinValid = /^https?:\/\/(www\.)?linkedin\.com\/.*$/i.test(linkedinUrl.trim());
  const isMobileValid   = mobileNumber.replace(/\D/g, '').length === 10;

  const isSignupValid = isEmailValid && isPasswordValid && isConfirmValid && isNameValid && isUserValid && isLinkedinValid && isMobileValid && avatarId;
  const isCompleteValid = isNameValid && isUserValid && isLinkedinValid && isMobileValid && avatarId;
  const isLoginValid = isEmailValid && password.length > 0;

  const handleLinkedinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinkedinUrl(e.target.value);
  };

  const fireCannons = () => {
    const fire = confettiRef.current?.fire;
    if (!fire) return;
    const d = { startVelocity: 40, spread: 360, ticks: 60, zIndex: 100, particleCount: 70 };
    fire({ ...d, origin: { x: 0, y: 1 }, angle: 60 });
    fire({ ...d, origin: { x: 1, y: 1 }, angle: 120 });
  };

  const submitAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mode === 'signup' && !isSignupValid) return;
    if (mode === 'login' && !isLoginValid) return;
    if (mode === 'complete' && !isCompleteValid) return;
    if (mode === 'forgot-password' && !isEmailValid) return;

    setModalStatus('loading');

    if (mode === 'forgot-password') {
      if (onResetPassword) {
        const err = await onResetPassword(email);
        if (err) { setModalError(err); setModalStatus('error'); return; }
        setSuccessMessage('Reset link sent to your email!');
        setModalStatus('success');
        setTimeout(() => {
          setModalStatus('closed');
          setMode('login');
        }, 3000);
      }
      return;
    }

    if (onEmailSubmit) {
      const payload = mode === 'login'
        ? { email, password }
        : { email, password, fullName, username, mobileNumber, linkedinUrl, avatarId }; // mode=complete password will be empty string, but ignored in actions.ts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await onEmailSubmit(payload as any);
      const err = typeof res === 'string' ? res : res?.error;
      const type = typeof res === 'object' ? res?.type : 'success';
      if (err) { setModalError(err); setModalStatus('error'); return; }
      
      if (type === 'check_email') {
        sessionStorage.setItem('pendingVerificationEmail', payload.email);
        setSuccessMessage('Check your email for the verification link!');
        setIsCheckEmail(true);
        setResendCooldown(30);
        setModalStatus('success');
        // Do NOT auto-redirect — user must click the link in their email
        return;
      }
    }
    setSuccessMessage('Welcome Aboard!');
    const total = (modalSteps.length - 1) * TEXT_LOOP_INTERVAL * 1000;
    setTimeout(() => {
      fireCannons(); setModalStatus('success');
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    }, total);
  };

  useEffect(() => { if (modalStatus === 'success' && !isCheckEmail) fireCannons(); }, [modalStatus, isCheckEmail]);

  // countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!onResendEmail || resendCooldown > 0) return;
    setResendMsg('');
    const err = await onResendEmail(email);
    if (err) { setResendMsg('Failed to resend. Try again.'); }
    else { setResendMsg('Email resent!'); setResendCooldown(30); setTimeout(() => setResendMsg(''), 3000); }
  };

  const meta = {
    initial: { title: 'Welcome', subtitle: 'Join PostForge AI today' },
    login: { title: 'Welcome back', subtitle: 'Sign in to your account' },
    signup: { title: 'Create account', subtitle: 'Fill in your details below' },
    complete: { title: 'Almost there', subtitle: 'Complete your profile to continue' },
    'forgot-password': { title: 'Reset Password', subtitle: 'Enter your email to receive a reset link' }
  }[mode];

  return (
    <div className="bg-black min-h-screen w-screen flex flex-col overflow-hidden">
      <style>{`
        input[type="password"]::-ms-reveal,input[type="password"]::-ms-clear{display:none!important}input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus,input:-webkit-autofill:active{-webkit-box-shadow:0 0 0 30px transparent inset!important;-webkit-text-fill-color:white!important;background-color:transparent!important;transition:background-color 5000s ease-in-out 0s!important;caret-color:white!important}
        @property --angle-1{syntax:"<angle>";inherits:false;initial-value:-75deg}@property --angle-2{syntax:"<angle>";inherits:false;initial-value:-45deg}
        .glass-button-wrap{--anim-time:400ms;--anim-ease:cubic-bezier(.25,1,.5,1);--border-width:clamp(1px,.0625em,4px);position:relative;z-index:2;transform-style:preserve-3d;transition:transform var(--anim-time) var(--anim-ease);width:100%}.glass-button-wrap:has(.glass-button:active){transform:rotateX(25deg)}.glass-button-shadow{--shadow-cutoff-fix:2em;position:absolute;width:calc(100% + var(--shadow-cutoff-fix));height:calc(100% + var(--shadow-cutoff-fix));top:calc(0% - var(--shadow-cutoff-fix)/2);left:calc(0% - var(--shadow-cutoff-fix)/2);filter:blur(clamp(2px,.125em,12px));transition:filter var(--anim-time) var(--anim-ease);pointer-events:none;z-index:0}.glass-button-shadow::after{content:"";position:absolute;inset:0;border-radius:9999px;background:linear-gradient(180deg,oklch(from var(--foreground) l c h/20%),oklch(from var(--foreground) l c h/10%));width:calc(100% - var(--shadow-cutoff-fix) - .25em);height:calc(100% - var(--shadow-cutoff-fix) - .25em);top:calc(var(--shadow-cutoff-fix) - .5em);left:calc(var(--shadow-cutoff-fix) - .875em);padding:.125em;box-sizing:border-box;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;transition:all var(--anim-time) var(--anim-ease);opacity:1}.glass-button{-webkit-tap-highlight-color:transparent;backdrop-filter:blur(clamp(1px,.125em,4px));transition:all var(--anim-time) var(--anim-ease);background:linear-gradient(-75deg,oklch(from var(--background) l c h/5%),oklch(from var(--background) l c h/20%),oklch(from var(--background) l c h/5%));box-shadow:inset 0 .125em .125em oklch(from var(--foreground) l c h/5%),inset 0 -.125em .125em oklch(from var(--background) l c h/50%),0 .25em .125em -.125em oklch(from var(--foreground) l c h/20%),0 0 .1em .25em inset oklch(from var(--background) l c h/20%),0 0 0 0 oklch(from var(--background) l c h)}.glass-button:hover{transform:scale(.975);backdrop-filter:blur(.01em)}.glass-button-text{color:white !important;text-shadow:0em .25em .05em rgba(0,0,0,0.3) !important;transition:all var(--anim-time) var(--anim-ease)}.glass-button::after{content:"";position:absolute;z-index:1;inset:0;border-radius:9999px;width:calc(100% + var(--border-width));height:calc(100% + var(--border-width));top:calc(0% - var(--border-width)/2);left:calc(0% - var(--border-width)/2);padding:var(--border-width);box-sizing:border-box;background:conic-gradient(from var(--angle-1) at 50% 50%,oklch(from var(--foreground) l c h/50%) 0%,transparent 5% 40%,oklch(from var(--foreground) l c h/50%) 50%,transparent 60% 95%,oklch(from var(--foreground) l c h/50%) 100%),linear-gradient(180deg,oklch(from var(--background) l c h/50%),oklch(from var(--background) l c h/50%));mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;transition:all var(--anim-time) var(--anim-ease),--angle-1 500ms ease;pointer-events:none}.glass-button:hover::after{--angle-1:-125deg}
        .glass-input-wrap{position:relative;z-index:2;transform-style:preserve-3d;border-radius:9999px}.glass-input{display:flex;position:relative;width:100%;align-items:center;gap:.5rem;border-radius:9999px;padding:.25rem;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(clamp(1px,.125em,4px));background:linear-gradient(-75deg,oklch(from var(--background) l c h/5%),oklch(from var(--background) l c h/20%),oklch(from var(--background) l c h/5%));box-shadow:inset 0 .125em .125em oklch(from var(--foreground) l c h/5%),inset 0 -.125em .125em oklch(from var(--background) l c h/50%),0 .25em .125em -.125em oklch(from var(--foreground) l c h/20%),0 0 .1em .25em inset oklch(from var(--background) l c h/20%)}.glass-input::after{content:"";position:absolute;z-index:1;inset:0;border-radius:9999px;width:calc(100% + clamp(1px,.0625em,4px));height:calc(100% + clamp(1px,.0625em,4px));top:calc(0% - clamp(1px,.0625em,4px)/2);left:calc(0% - clamp(1px,.0625em,4px)/2);padding:clamp(1px,.0625em,4px);box-sizing:border-box;background:conic-gradient(from var(--angle-1) at 50% 50%,oklch(from var(--foreground) l c h/50%) 0%,transparent 5% 40%,oklch(from var(--foreground) l c h/50%) 50%,transparent 60% 95%,oklch(from var(--foreground) l c h/50%) 100%),linear-gradient(180deg,oklch(from var(--background) l c h/50%),oklch(from var(--background) l c h/50%));mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;transition:all 400ms cubic-bezier(.25,1,.5,1),--angle-1 500ms ease;pointer-events:none}.glass-input-wrap:focus-within .glass-input::after{--angle-1:-125deg}.glass-input-text-area{position:absolute;inset:0;border-radius:9999px;pointer-events:none}
      `}</style>

      <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />

      {/* ——— Modal ————————————————————————————————————————————————————— */}
      <AnimatePresence>
        {modalStatus !== 'closed' &&
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900/90 border border-white/10 rounded-3xl p-10 w-full max-w-md flex flex-col items-center gap-6 mx-4 shadow-2xl">
              {(modalStatus === 'error' || modalStatus === 'success') && <button type="button" onClick={() => { setModalStatus('closed'); setModalError(''); }} className="absolute top-4 right-4 text-white/40 hover:text-white/80"><X className="w-6 h-6" /></button>}
              {modalStatus === 'error' && <><AlertCircle className="w-16 h-16 text-red-400" /><p className="text-xl font-medium text-white text-center">{modalError}</p><GlassButton type="button" onClick={() => { setModalStatus('closed'); setModalError(''); }} size="sm">Try Again</GlassButton></>}
              {modalStatus === 'loading' && <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd>{modalSteps.slice(0, -1).map((s, i) => <div key={i} className="flex flex-col items-center gap-6">{s.icon}<p className="text-xl font-medium text-white">{s.message}</p></div>)}</TextLoop>}
              {modalStatus === 'success' && !isCheckEmail && <div className="flex flex-col items-center gap-6">{modalSteps[modalSteps.length - 1].icon}<p className="text-xl font-medium text-white text-center">{successMessage}</p></div>}
              {modalStatus === 'success' && isCheckEmail && (
                <div className="flex flex-col items-center gap-5 text-center">
                  <Mail className="w-16 h-16 text-blue-400" />
                  <p className="text-xl font-semibold text-white">{successMessage}</p>
                  <p className="text-sm text-white/60 max-w-xs">Click the link in your email to verify your account. Once verified, come back here and refresh the page to access your dashboard.</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className={cn('mt-2 px-6 py-2 rounded-full text-sm font-medium transition-all', resendCooldown > 0 ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-white/20 text-white hover:bg-white/30 cursor-pointer')}
                  >
                    {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}
                  </button>
                  {resendMsg && <p className={cn('text-sm', resendMsg === 'Email resent!' ? 'text-green-400' : 'text-red-400')}>{resendMsg}</p>}
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem('pendingVerificationEmail');
                      setIsCheckEmail(false);
                      setModalStatus('closed');
                      setMode('login');
                    }}
                    className="mt-2 text-sm text-white/50 hover:text-white underline transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {/* ── Logo bar ── */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20">
        <BrandLogo size="md" showTagline className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
      </div>

      {/* ——— Main content ————————————————————————————————————————————————— */}
      <div className="flex w-full flex-1 min-h-screen items-center justify-center relative overflow-y-auto pt-32 pb-16">
        <div className="fixed inset-0 z-0 bg-black"><GradientBackground /></div>
        
        {/* â”€â”€ Background Typography Animations â”€â”€ */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div 
            initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="absolute left-20 top-[40%] -translate-y-1/2">
            <h2 className="text-[5rem] font-serif font-bold text-white whitespace-nowrap drop-shadow-2xl leading-[1.1]">Connect to<br/>the world</h2>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="absolute right-20 top-[60%] -translate-y-1/2 text-right">
            <h2 className="text-[5rem] font-serif font-bold text-white whitespace-nowrap drop-shadow-2xl leading-[1.1]">Forge Your<br/>AI Identity</h2>
          </motion.div>
        </div>

        <div className={`relative z-10 flex flex-col items-center gap-8 w-full max-w-[480px] mx-auto px-6 my-auto ${modalStatus !== 'closed' ? 'pointer-events-none opacity-50' : ''}`}>
          
          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ y: 8, opacity: 1 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.25 }} className="text-center w-full">
              <div className="flex items-center gap-3 mb-3">
                {mode !== 'initial' && mode !== 'complete' &&
                  <button type="button" onClick={() => setMode('initial')} className="text-white/60 hover:text-white p-2 rounded-full transition-colors absolute left-0">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                }
                <p className="font-serif font-light text-5xl sm:text-6xl tracking-tight text-white flex-1">{meta.title}</p>
              </div>
              {meta.subtitle && <p className="text-lg text-neutral-300 mt-3">{meta.subtitle}</p>}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            
            {/* ——— INITIAL MODE ——— */}
            {mode === 'initial' &&
              <motion.div key="initial" initial={{ y: 10, opacity: 1 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.3 }} className="w-full space-y-5">
                <GlassButton type="button" onClick={onGoogleSignIn} contentClassName="flex items-center justify-center gap-4 text-white w-full text-xl font-medium">
                  <GoogleIcon /> <span>Continue with Google</span>
                </GlassButton>
                
                <GlassButton type="button" onClick={() => setMode('signup')} contentClassName="flex items-center justify-center gap-4 text-white w-full text-xl font-medium">
                  <Mail className="w-6 h-6 text-white/80" /> <span>Continue with Email</span>
                </GlassButton>

                <p className="text-center text-lg text-neutral-400 pt-6">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-white font-semibold hover:underline">Log in</button>
                </p>
              </motion.div>
            }

            {/* â”€â”€ LOGIN MODE â”€â”€ */}
            {mode === 'login' &&
              <motion.form key="login" onSubmit={submitAuth} initial={{ y: 10, opacity: 1 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.3 }} className="w-full space-y-5">
                
                <GlassButton type="button" onClick={onGoogleSignIn} contentClassName="flex items-center justify-center gap-4 text-white w-full text-xl font-medium">
                  <GoogleIcon /> <span>Log in with Google</span>
                </GlassButton>
                
                <div className="flex items-center gap-4 w-full py-2">
                  <div className="h-px bg-white/20 flex-1"></div>
                  <span className="text-white/50 text-sm">or log in with email</span>
                  <div className="h-px bg-white/20 flex-1"></div>
                </div>

                <GlassInput icon={<Mail className="h-6 w-6 text-white/70" />}>
                  <input autoFocus type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
                    className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 text-lg" />
                </GlassInput>
                
                <div className="space-y-3">
                  <GlassInput icon={
                    <button type="button" onClick={() => setShowPassword((p: boolean) => !p)} className="text-white/80 hover:text-white p-2 rounded-full transition-colors">
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  }>
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
                      className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 text-lg" />
                  </GlassInput>
                  
                  <div className="flex justify-end px-2">
                    <button type="button" onClick={() => setMode('forgot-password')} className="text-sm text-white/60 hover:text-white hover:underline transition-all">
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <GlassButton type="submit" disabled={!isLoginValid} className={cn(!isLoginValid && "opacity-50 cursor-not-allowed")} contentClassName="flex items-center justify-center gap-3 text-white w-full text-xl">
                    Log In <ArrowRight className="w-6 h-6" />
                  </GlassButton>
                </div>


              </motion.form>
            }

            {mode === 'forgot-password' &&
              <motion.form key="forgot-password" onSubmit={submitAuth} initial={{ y: 10, opacity: 1 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.3 }} className="w-full space-y-5">
                <GlassInput icon={<Mail className="h-6 w-6 text-white/70" />}>
                  <input autoFocus type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
                    className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 text-lg" />
                </GlassInput>

                <div className="pt-4">
                  <GlassButton type="submit" disabled={!isEmailValid} className={cn(!isEmailValid && "opacity-50 cursor-not-allowed")} contentClassName="flex items-center justify-center gap-3 text-white w-full text-xl">
                    Send Reset Link <ArrowRight className="w-6 h-6" />
                  </GlassButton>
                </div>
              </motion.form>
            }

            {/* â”€â”€ COMPLETE PROFILE MODE (Google Signup) â”€â”€ */}
            {mode === 'complete' &&
              <motion.form key="complete" onSubmit={submitAuth} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.3 }} className="w-full space-y-5">
                
                <div className="space-y-5 pb-4">
                  <GlassInput icon={<User className="h-6 w-6 text-white/70" />}>
                    <input autoFocus type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required
                      className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                  </GlassInput>
                  
                  <div className="space-y-2">
                    <GlassInput icon={<LinkedinIcon className="h-6 w-6 text-blue-400" />}>
                      <input type="url" placeholder="LinkedIn URL (required)" value={linkedinUrl} onChange={handleLinkedinChange} required
                        className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                    </GlassInput>
                    {linkedinUrl.length > 0 && !isLinkedinValid && (
                      <p className="text-sm text-red-400 pl-5">Invalid LinkedIn profile URL</p>
                    )}
                  </div>
                  
                  <GlassInput icon={<AtSign className="h-6 w-6 text-white/70" />}>
                    <input type="text" placeholder="Username" value={username} readOnly
                      className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white/70 placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg cursor-not-allowed select-none" title="Username is automatically generated and cannot be changed" />
                  </GlassInput>
                  
                  <div className="space-y-2">
                    <GlassInput icon={<Phone className="h-6 w-6 text-white/70" />}>
                      <input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required
                        className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                    </GlassInput>
                    {mobileNumber.length > 0 && mobileNumber.replace(/\D/g, '').length !== 10 && (
                      <p className="text-sm text-red-400 pl-5">Invalid mobile number</p>
                    )}
                  </div>
                </div>

                {/* Avatar Selection at bottom */}
                <div className="pt-2 pb-4">
                  <p className="text-base text-white/80 mb-4 font-medium px-2">Choose your avatar</p>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATARS.map((av) => (
                      <button key={av.id} type="button" onClick={() => setAvatarId(av.id)}
                        className={cn("relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 border",
                          avatarId === av.id ? "border-white/60 bg-white/10 scale-[1.05]" : "border-white/10 hover:border-white/30 hover:bg-white/5")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={av.src} alt={av.label} className="w-14 h-14 rounded-full object-cover shadow-lg" />

                        {avatarId === av.id &&
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                            <Check className="w-3 h-3 text-black" strokeWidth={3} />
                          </div>
                        }
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <GlassButton type="submit" disabled={!isCompleteValid} className={cn(!isCompleteValid && "opacity-50 cursor-not-allowed")} contentClassName="flex items-center justify-center gap-3 text-white w-full text-xl">
                    Save &amp; Continue <ArrowRight className="w-6 h-6" />
                  </GlassButton>
                </div>

              </motion.form>
            }

            {/* ── SIGNUP MODE (Email) ── */}
            {mode === 'signup' &&
              <motion.form key="signup" onSubmit={submitAuth} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.3 }} className="w-full space-y-5">
                
                <GlassButton type="button" onClick={onGoogleSignIn} contentClassName="flex items-center justify-center gap-4 text-white w-full text-xl font-medium">
                  <GoogleIcon /> <span>Sign up with Google</span>
                </GlassButton>
                
                <div className="flex items-center gap-4 w-full py-2">
                  <div className="h-px bg-white/20 flex-1"></div>
                  <span className="text-white/50 text-sm">or</span>
                  <div className="h-px bg-white/20 flex-1"></div>
                </div>

                <div className="space-y-5 pb-4">
                  <GlassInput icon={<User className="h-6 w-6 text-white/70" />}>
                    <input autoFocus type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required
                      className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                  </GlassInput>
                  
                  <div className="space-y-2">
                    <GlassInput icon={<LinkedinIcon className="h-6 w-6 text-blue-400" />}>
                      <input type="url" placeholder="LinkedIn URL (required)" value={linkedinUrl} onChange={handleLinkedinChange} required
                        className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                    </GlassInput>
                    {linkedinUrl.length > 0 && !isLinkedinValid && (
                      <p className="text-sm text-red-400 pl-5">Invalid LinkedIn profile URL</p>
                    )}
                  </div>
                  
                  <GlassInput icon={<AtSign className="h-6 w-6 text-white/70" />}>
                    <input type="text" placeholder="Username" value={username} readOnly
                      className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white/70 placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg cursor-not-allowed select-none" title="Username is automatically generated and cannot be changed" />
                  </GlassInput>
                  
                  <div className="space-y-2">
                    <GlassInput icon={<Phone className="h-6 w-6 text-white/70" />}>
                      <input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required
                        className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                    </GlassInput>
                    {mobileNumber.length > 0 && mobileNumber.replace(/\D/g, '').length !== 10 && (
                      <p className="text-sm text-red-400 pl-5">Invalid mobile number</p>
                    )}
                  </div>

                  <GlassInput icon={<Mail className="h-6 w-6 text-white/70" />}>
                    <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
                      className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                  </GlassInput>

                  <div className="space-y-2">
                    <GlassInput icon={
                      <button type="button" onClick={() => setShowPassword((p: boolean) => !p)} className="text-white/80 hover:text-white p-2 rounded-full transition-colors">
                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      </button>
                    }>
                      <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={12}
                        className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                    </GlassInput>
                    {password.length > 0 && password.length < 12 &&
                      <p className="text-sm text-red-400 pl-5">Minimum 12 characters</p>
                    }
                  </div>

                  <div className="space-y-2">
                    <GlassInput icon={
                      <button type="button" onClick={() => setShowConfirm((p: boolean) => !p)} className="text-white/80 hover:text-white p-2 rounded-full transition-colors">
                        {showConfirm ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      </button>
                    }>
                      <input type={showConfirm ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={12}
                        className="relative z-10 h-full w-0 flex-grow bg-transparent !text-white placeholder:text-white/50 focus:outline-none py-4 pr-4 text-lg" />
                    </GlassInput>
                    {confirmPassword.length > 0 && !isConfirmValid &&
                      <p className="text-sm text-red-400 pl-5">Passwords must match</p>
                    }
                  </div>
                </div>

                {/* Avatar Selection at bottom */}
                <div className="pt-2 pb-4">
                  <p className="text-base text-white/80 mb-4 font-medium px-2">Choose your avatar</p>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATARS.map((av) => (
                      <button key={av.id} type="button" onClick={() => setAvatarId(av.id)}
                        className={cn("relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 border",
                          avatarId === av.id ? "border-white/60 bg-white/10 scale-[1.05]" : "border-white/10 hover:border-white/30 hover:bg-white/5")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={av.src} alt={av.label} className="w-14 h-14 rounded-full object-cover shadow-lg" />

                        {avatarId === av.id &&
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                            <Check className="w-3 h-3 text-black" strokeWidth={3} />
                          </div>
                        }
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <GlassButton type="submit" disabled={!isSignupValid} className={cn(!isSignupValid && "opacity-50 cursor-not-allowed")} contentClassName="flex items-center justify-center gap-3 text-white w-full text-xl">
                    Create Account <ArrowRight className="w-6 h-6" />
                  </GlassButton>
                </div>


              </motion.form>
            }
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};
