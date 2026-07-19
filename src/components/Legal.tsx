import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, FileText, Copyright, Database } from "lucide-react";

export type LegalDoc = "privacy" | "terms" | "ip" | "data";

// NOTE FOR THE OPERATOR: replace [Operator], [contact email], and [jurisdiction]
// with your real details, and have a lawyer review before relying on these for
// a live product. These are a solid starting template, not legal advice.
const OPERATOR = "[Operator]";
const CONTACT = "[contact email]";
const UPDATED = "19 July 2026";

const docs: Record<LegalDoc, { title: string; icon: React.ReactNode; body: React.ReactNode }> = {
  privacy: {
    title: "Privacy Policy",
    icon: <Shield className="h-4 w-4" />,
    body: (
      <>
        <p><strong>Last updated:</strong> {UPDATED}</p>
        <p>insyte ("the Service") is operated by {OPERATOR}. This policy explains what we collect and why.</p>
        <h4>What we collect</h4>
        <ul>
          <li><strong>Account data:</strong> your name, email, role (student or teacher), and a securely hashed password. We never store your password in plain text.</li>
          <li><strong>Learning data:</strong> classes you join, lessons, assignments, submissions, grades, XP, streaks, messages, and mail you send within the Service.</li>
          <li><strong>Technical data:</strong> basic request logs and IP address, used for security and rate limiting.</li>
        </ul>
        <h4>How we use it</h4>
        <p>To run the Service: authenticate you, show your classes, deliver mail and notifications, and keep the platform secure. We do not sell your data or use it for advertising.</p>
        <h4>AI features</h4>
        <p>The AI Tutor sends your questions and relevant class context to Google's Gemini API to generate replies. Do not enter sensitive personal information into the tutor.</p>
        <h4>Sharing</h4>
        <p>Your name, avatar, level, and XP are visible to other members of classes you join. Your email, mailbox, and submission contents are private to you and the relevant teacher. We share data with infrastructure providers (hosting, database, AI) only as needed to operate the Service.</p>
        <h4>Your choices</h4>
        <p>You can leave a class, edit your profile, or request deletion of your account by contacting {CONTACT}. Minors should use the Service under the supervision of a parent, guardian, or school.</p>
        <h4>Contact</h4>
        <p>Questions about privacy: {CONTACT}.</p>
      </>
    )
  },
  terms: {
    title: "Terms of Use",
    icon: <FileText className="h-4 w-4" />,
    body: (
      <>
        <p><strong>Last updated:</strong> {UPDATED}</p>
        <p>By creating an account or using insyte you agree to these Terms. If you do not agree, do not use the Service.</p>
        <h4>Your account</h4>
        <p>You are responsible for the activity under your account and for keeping your password secure. Provide accurate information and do not impersonate others.</p>
        <h4>Acceptable use</h4>
        <ul>
          <li>Do not post unlawful, harassing, hateful, or infringing content.</li>
          <li>Do not attempt to break, overload, probe, or gain unauthorized access to the Service or other users' data.</li>
          <li>Do not upload malware or use the Service to spam.</li>
          <li>Use the AI Tutor for study; do not attempt to extract other users' data through it.</li>
        </ul>
        <h4>Content</h4>
        <p>You keep ownership of content you create (lessons, submissions, messages). You grant {OPERATOR} a limited license to store and display it to deliver the Service. Teachers are responsible for content they publish to their classes.</p>
        <h4>Availability</h4>
        <p>The Service is provided "as is" without warranties. We may change, suspend, or discontinue features, and we are not liable for lost data or interruptions to the fullest extent permitted by law.</p>
        <h4>Termination</h4>
        <p>We may suspend accounts that violate these Terms. You may stop using the Service at any time.</p>
        <h4>Governing law</h4>
        <p>These Terms are governed by the laws of [jurisdiction]. Contact: {CONTACT}.</p>
      </>
    )
  },
  ip: {
    title: "Intellectual Property & Infringement",
    icon: <Copyright className="h-4 w-4" />,
    body: (
      <>
        <p><strong>Last updated:</strong> {UPDATED}</p>
        <h4>Our rights</h4>
        <p>The insyte name, interface, and software are the property of {OPERATOR} and protected by intellectual property laws. You may not copy, resell, or create derivative products from the Service without permission.</p>
        <h4>Your content</h4>
        <p>You must have the right to any material you upload (text, links, videos, images). Do not post content that infringes someone else's copyright, trademark, or other rights.</p>
        <h4>Reporting infringement (takedown)</h4>
        <p>If you believe content on insyte infringes your rights, email {CONTACT} with:</p>
        <ul>
          <li>your contact details;</li>
          <li>a description and location (link) of the material;</li>
          <li>proof you own the rights or are authorized to act;</li>
          <li>a statement, made in good faith, that the use is not authorized.</li>
        </ul>
        <p>We will review valid notices and remove infringing content. Repeat infringers may lose access.</p>
        <h4>Counter-notice</h4>
        <p>If your content was removed in error, you may reply to {CONTACT} explaining why, and we will consider reinstating it.</p>
      </>
    )
  },
  data: {
    title: "Data & Compliance",
    icon: <Database className="h-4 w-4" />,
    body: (
      <>
        <p><strong>Last updated:</strong> {UPDATED}</p>
        <h4>Where data lives</h4>
        <p>Account and learning data are stored in our database (Supabase) and served through our backend. Passwords are stored only as salted scrypt hashes. Access to data is gated by authentication and, at the database layer, by Row Level Security.</p>
        <h4>Security measures</h4>
        <ul>
          <li>Passwords hashed with scrypt; never stored or logged in plain text.</li>
          <li>Session tokens for authenticated requests; per-IP rate limiting on sign-in.</li>
          <li>Security headers (CSP, X-Frame-Options, no-sniff) and a validated CORS allowlist.</li>
          <li>API responses expose only the fields each user is entitled to.</li>
        </ul>
        <h4>Data retention & deletion</h4>
        <p>We keep your data while your account is active. Email {CONTACT} to export or delete your data. On account deletion we remove your profile, mail, and submissions, subject to any legal retention duties.</p>
        <h4>Children & schools</h4>
        <p>insyte is intended for use within a class or school context. If you operate insyte for minors, ensure you have the appropriate parental or institutional consent and comply with local student-data rules (for example COPPA, FERPA, or GDPR where applicable).</p>
        <h4>Breach response</h4>
        <p>If a data breach affecting your information occurs, we will investigate, contain it, and notify affected users and authorities where required by law.</p>
        <h4>Contact</h4>
        <p>Data protection requests: {CONTACT}.</p>
      </>
    )
  }
};

// Footer strip of links that opens the legal modal.
export const LegalFooter: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const [open, setOpen] = useState<LegalDoc | null>(null);
  const linkCls = dark
    ? "text-slate-400 hover:text-slate-200"
    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200";
  const order: LegalDoc[] = ["privacy", "terms", "ip", "data"];
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
        {order.map((k) => (
          <button key={k} onClick={() => setOpen(k)} className={`${linkCls} cursor-pointer transition-colors`}>
            {docs[k].title}
          </button>
        ))}
      </div>
      <LegalModal open={open} onClose={() => setOpen(null)} />
    </>
  );
};

export const LegalModal: React.FC<{ open: LegalDoc | null; onClose: () => void }> = ({ open, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#241c49]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 font-display">
                <span className="text-indigo-500">{docs[open].icon}</span>
                {docs[open].title}
              </h3>
              <button onClick={onClose} aria-label="Close" className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="legal-body overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 space-y-2">
              {docs[open].body}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
