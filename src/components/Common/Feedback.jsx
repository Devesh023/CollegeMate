import React, { useState, useEffect, useRef } from 'react';
import { Star, Send, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function Feedback() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackType, setFeedbackType] = useState('General Feedback');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const cooldownInterval = useRef(null);

  // Load remaining cooldown from localStorage if page is reloaded
  useEffect(() => {
    const savedCooldownTime = localStorage.getItem('cm_feedback_cooldown_expiry');
    if (savedCooldownTime) {
      const expiry = parseInt(savedCooldownTime, 10);
      const remaining = Math.ceil((expiry - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        startCooldownTimer(remaining);
      } else {
        localStorage.removeItem('cm_feedback_cooldown_expiry');
      }
    }

    return () => {
      if (cooldownInterval.current) clearInterval(cooldownInterval.current);
    };
  }, []);

  const startCooldownTimer = (seconds) => {
    if (cooldownInterval.current) clearInterval(cooldownInterval.current);
    
    setCooldown(seconds);
    cooldownInterval.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownInterval.current);
          localStorage.removeItem('cm_feedback_cooldown_expiry');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let tem;
    let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
      if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return M.join(' ');
  };

  const getDeviceType = () => {
    return /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please enter a feedback message.');
      return;
    }
    if (message.length > 1000) {
      setErrorMsg('Feedback message exceeds the 1000 characters limit.');
      return;
    }
    if (cooldown > 0) {
      setErrorMsg(`Please wait ${cooldown}s before submitting again.`);
      return;
    }

    setSending(true);
    setErrorMsg(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Temporary logs to verify config values at runtime
    console.log("EmailJS Config", {
      serviceId,
      templateId,
      publicKey
    });

    const payload = {
      name: name.trim() || 'Anonymous',
      email: email.trim() || 'Not provided',
      type: feedbackType,
      rating: rating > 0 ? `${rating} Stars` : 'No rating provided',
      message: message.trim()
    };

    try {
      console.log('[EmailJS] Initializing feedback submission...');
      console.log('[EmailJS] Environment Keys Check:', {
        hasServiceId: !!serviceId,
        hasTemplateId: !!templateId,
        hasPublicKey: !!publicKey
      });

      if (!serviceId || !templateId || !publicKey) {
        // Mock success mode if credentials are not configured
        console.warn('[EmailJS] Credentials not configured in .env. Simulating successful send with payload:', payload);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } else {
        // Actual SDK API call
        console.log('[EmailJS] Dispatching SDK send call with parameters:', payload);
        const result = await emailjs.send(
          serviceId,
          templateId,
          payload,
          publicKey
        );
        console.log('[EmailJS] Send success result:', result);
      }

      // Success
      setSuccess(true);
      
      // Clear form
      setName('');
      setEmail('');
      setFeedbackType('General Feedback');
      setRating(0);
      setMessage('');

      // Enforce 5-second cooldown
      const cooldownExpiry = Date.now() + 5000;
      localStorage.setItem('cm_feedback_cooldown_expiry', cooldownExpiry.toString());
      startCooldownTimer(5);

      // Auto close success dialog after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('[EmailJS] Feedback send failed:', err);
      const errMsg = err.message || String(err);
      if (errMsg.includes('user_id') || errMsg.includes('public key')) {
        setErrorMsg('Failed to send feedback: Invalid EmailJS Public Key.');
      } else if (errMsg.includes('service_id') || errMsg.includes('service')) {
        setErrorMsg('Failed to send feedback: Invalid EmailJS Service ID.');
      } else if (errMsg.includes('template_id') || errMsg.includes('template')) {
        setErrorMsg('Failed to send feedback: Invalid EmailJS Template ID.');
      } else {
        setErrorMsg(`Failed to send feedback: ${errMsg}`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleStarKeyDown = (e, starValue) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setRating(starValue);
    }
  };

  return (
    <div 
      id="feedback-section" 
      className="w-full h-full transition-colors duration-200 animate-fadeIn"
    >
      <div className="relative h-full overflow-hidden rounded-3xl border border-brand-border bg-brand-card/70 backdrop-blur-xl p-8 sm:p-10 lg:p-12 shadow-2xl space-y-8">
        {/* Soft background glows */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>

        <div className="text-center space-y-2 relative z-10">
          <h2 id="feedback-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-heading">
            Feedback & Suggestions
          </h2>
          <p className="text-sm text-brand-body max-w-xl mx-auto">
            Help us improve CollegeMate by sharing your feedback, reporting bugs, or suggesting new features.
          </p>
        </div>

        {errorMsg && (
          <div 
            role="alert" 
            className="flex items-start space-x-2.5 rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error animate-slideDown"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="feedback-name" className="text-sm font-semibold text-brand-heading">
                Full Name <span className="text-xs text-brand-muted font-normal">(Optional)</span>
              </label>
              <input
                id="feedback-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={sending}
                className="w-full h-11 px-4 rounded-xl border border-brand-border bg-brand-bg/50 text-sm text-brand-heading placeholder-brand-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="feedback-email" className="text-sm font-semibold text-brand-heading">
                Email Address <span className="text-xs text-brand-muted font-normal">(Optional)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={sending}
                className="w-full h-11 px-4 rounded-xl border border-brand-border bg-brand-bg/50 text-sm text-brand-heading placeholder-brand-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feedback Type */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="feedback-type" className="text-sm font-semibold text-brand-heading">
                Feedback Type
              </label>
              <select
                id="feedback-type"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                disabled={sending}
                className="w-full h-11 px-4 rounded-xl border border-brand-border bg-brand-bg/50 text-sm text-brand-heading focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <option value="General Feedback">General Feedback</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="College Data Issue">College Data Issue</option>
              </select>
            </div>

            {/* Rating Stars */}
            <div className="space-y-1.5 text-left">
              <span id="rating-label" className="text-sm font-semibold text-brand-heading block">
                Rating <span className="text-xs text-brand-muted font-normal">(Optional)</span>
              </span>
              <div 
                role="radiogroup" 
                aria-labelledby="rating-label"
                className="flex items-center space-x-1.5 h-11"
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isActive = starValue <= (hoverRating || rating);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      role="radio"
                      aria-checked={starValue === rating}
                      aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
                      onMouseEnter={() => !sending && setHoverRating(starValue)}
                      onMouseLeave={() => !sending && setHoverRating(0)}
                      onClick={() => !sending && setRating(starValue)}
                      onKeyDown={(e) => !sending && handleStarKeyDown(e, starValue)}
                      disabled={sending}
                      className="p-1 text-brand-muted hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Star 
                        className={`h-6 w-6 transition-all duration-150 ${
                          isActive 
                            ? 'fill-amber-500 text-amber-500 scale-110 drop-shadow-sm' 
                            : 'text-brand-muted/70'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label htmlFor="feedback-message" className="text-sm font-semibold text-brand-heading">
                Message <span className="text-error font-bold">*</span>
              </label>
              <span 
                className={`text-xs font-medium ${
                  message.length > 950 ? 'text-error font-bold' : 'text-brand-muted'
                }`}
                aria-live="polite"
              >
                {message.length} / 1000 characters
              </span>
            </div>
            <textarea
              id="feedback-message"
              required
              aria-required="true"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder="Tell us what you think..."
              disabled={sending}
              rows={4}
              maxLength={1000}
              className="w-full p-4 rounded-xl border border-brand-border bg-brand-bg/50 text-sm text-brand-heading placeholder-brand-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 text-center md:text-right">
            <button
              type="submit"
              disabled={sending || cooldown > 0}
              className="inline-flex h-11 w-full md:w-auto items-center justify-center space-x-2 rounded-xl bg-primary hover:bg-primary-hover disabled:bg-brand-border disabled:text-brand-muted text-sm font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed px-8"
            >
              {sending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Spam Protection Cooldown ({cooldown}s)</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Beautiful Success Dialog Overlay */}
        {success && (
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-dialog-title"
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-brand-card/90 backdrop-blur-md animate-fadeIn"
          >
            <div className="max-w-sm w-full text-center space-y-4 p-6 rounded-2xl border border-brand-border bg-brand-card shadow-2xl animate-scaleIn">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success animate-bounce">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 id="success-dialog-title" className="text-lg font-bold text-brand-heading">
                  ✅ Thank You!
                </h3>
                <p className="text-sm text-brand-body leading-relaxed">
                  Your feedback has been received successfully.
                </p>
                <p className="text-xs text-brand-muted leading-relaxed">
                  We truly appreciate your suggestions and will use them to improve CollegeMate.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
