"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import Link from "next/link";

export function LandingEnquiryPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const phoneNumber = "+919996667714";
    const message = "Hi! I'm interested in joining HIIT Fitness. Can you share more details?";
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;

    useEffect(() => {
        // Small delay before showing the popup
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300">
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-[#EE2A24] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Enquire Us</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/80 hover:text-white transition"
                        aria-label="Close popup"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 text-center flex flex-col items-center">
                    <p className="text-stone-700 mb-8 text-base font-medium">
                        Ready to start your fitness journey? Chat with our experts instantly on WhatsApp to find the perfect plan for you!
                    </p>

                    <Link
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold text-lg tracking-wide py-4 rounded-xl hover:bg-[#20bd5a] transition-all shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)]"
                    >
                        <MessageCircle className="w-6 h-6" />
                        ENQUIRY
                    </Link>
                </div>
            </div>
        </div>
    );
}
