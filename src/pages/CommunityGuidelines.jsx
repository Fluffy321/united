import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, CheckCircle, XCircle } from 'lucide-react';

const Rule = ({ emoji, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="text-2xl leading-none mt-0.5">{emoji}</span>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-[14px] text-slate-600 leading-relaxed">{children}</p>
      </div>
    </div>
  </div>
);

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Community Guidelines</h1>
          </div>
        </div>
        <p className="text-[14px] text-slate-500 mb-6 ml-12">JUnited is a Jewish community platform built on values of kavod (respect), chesed (kindness), and emet (truth). These guidelines keep it that way.</p>

        {/* The Golden Rule */}
        <div className="bg-blue-600 text-white rounded-2xl p-5 mb-6">
          <p className="text-[16px] font-bold mb-1">The Golden Rule</p>
          <p className="text-[15px] leading-relaxed opacity-90">"Love your neighbor as yourself" (Vayikra 19:18). Before posting, ask yourself: would I say this to someone's face in my community?</p>
        </div>

        {/* DO section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-[17px] font-bold text-slate-900">We encourage you to…</h2>
          </div>
          <div className="space-y-3">
            <Rule emoji="🤝" title="Be respectful & kind">Disagree with ideas, not with people. You can debate halacha, politics, or parenting styles — just keep it respectful and assume good faith.</Rule>
            <Rule emoji="🏘️" title="Support your community">Share opportunities, offer help, celebrate simchas, and lift each other up. That's what JUnited is built for.</Rule>
            <Rule emoji="✅" title="Be honest">Post accurate information. If you're unsure, say so. Spreading misinformation — even accidentally — erodes trust.</Rule>
            <Rule emoji="🛡️" title="Protect privacy">Don't share others' personal information without permission. That includes addresses, phone numbers, or personal struggles someone shared in confidence.</Rule>
          </div>
        </div>

        {/* DON'T section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-[17px] font-bold text-slate-900">These are never OK</h2>
          </div>
          <div className="space-y-3">
            <Rule emoji="🚫" title="No lashon hara">Don't share negative information about someone — even if it's true — in a way that harms their reputation without a constructive purpose. This is one of the most serious Torah prohibitions and one of the most common online sins.</Rule>
            <Rule emoji="🚫" title="No harassment">Targeting, bullying, or intimidating individuals is never acceptable — privately or publicly. One strike, and you may be permanently banned.</Rule>
            <Rule emoji="🚫" title="No hate speech or antisemitism">We will not tolerate content that demeans any group based on race, religion, ethnicity, gender, sexual orientation, or disability.</Rule>
            <Rule emoji="🚫" title="No spam or self-promotion">Don't flood feeds with commercial content or off-topic links. Use the Business Directory for promotions.</Rule>
            <Rule emoji="🚫" title="No adult content">JUnited is a family-friendly platform. No explicit, sexual, or graphic content of any kind.</Rule>
            <Rule emoji="🚫" title="No impersonation">Don't create accounts or posts pretending to be someone you're not — individuals, organizations, or rabbis.</Rule>
            <Rule emoji="🚫" title="No doxxing">Never share someone's private information (address, phone, workplace) without their explicit consent. This is an immediate permanent ban offense.</Rule>
          </div>
        </div>

        {/* Enforcement */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
          <h2 className="font-bold text-slate-900 mb-3">📋 What happens if you break the rules?</h2>
          <div className="space-y-2 text-[14px] text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">1st offense:</span>
              <span>Warning + content removed. We'll explain what happened and why.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 font-bold mt-0.5">2nd offense:</span>
              <span>Temporary suspension (1–30 days depending on severity).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">3rd offense / severe:</span>
              <span>Permanent ban. Doxxing, harassment of minors, or threats may result in immediate permanent ban on the first offense.</span>
            </div>
          </div>
          <p className="text-[13px] text-slate-500 mt-3">You can appeal any moderation decision by emailing <a href="mailto:appeals@junited.app" className="text-blue-600 underline">appeals@junited.app</a> within 14 days.</p>
        </div>

        {/* Report */}
        <div className="bg-slate-100 rounded-xl p-4 text-center text-[14px] text-slate-600">
          <p className="font-semibold text-slate-800 mb-1">See something that violates these guidelines?</p>
          <p>Use the <strong>Report</strong> button on any post or profile. Our moderation team reviews all reports, typically within 24 hours.</p>
        </div>
      </div>
    </div>
  );
}