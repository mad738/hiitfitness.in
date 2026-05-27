"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

// Once you paste the videos into public/videos, name them v1.mp4, v2.mp4, etc.
const videos = [
    {
        id: "v1",
        title: "High Intensity Training",
        src: "/videos/v1.mp4"
    },
    {
        id: "v2",
        title: "Strength Conditioning",
        src: "/videos/v2.mp4"
    },
    {
        id: "v3",
        title: "Functional Fitness",
        src: "/videos/v3.mp4"
    },
    {
        id: "v4",
        title: "HIIT Fitness Reel",
        src: "/videos/v4.mp4"
    }
];

function VideoCard({ vid, onClick }: { vid: typeof videos[0]; onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="relative cursor-pointer aspect-[3/4] sm:aspect-[9/16] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(238,42,36,0.2)] border border-stone-800 transition-all duration-500 hover:-translate-y-2 hover:border-[#EE2A24] group bg-stone-900 flex items-center justify-center"
        >
            {/* Fallback text while video is loading or if it's missing */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center z-0">
                <span className="text-stone-600 font-bold text-[10px] sm:text-sm tracking-widest uppercase mb-1">Loading</span>
            </div>

            {/* Native HTML5 Video for seamless, high-performance autoplay */}
            <video
                className="absolute inset-0 w-full h-full object-cover z-10"
                src={vid.src}
                autoPlay
                muted
                loop
                playsInline
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent sm:from-black/80 sm:via-transparent sm:to-black/20 z-20 pointer-events-none opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 z-30 translate-y-0 sm:translate-y-4 opacity-100 sm:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <p className="text-white font-bold text-xs sm:text-lg leading-tight drop-shadow-md">
                    {vid.title}
                </p>
            </div>
        </div>
    );
}

export function LandingVideos() {
    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    // Handle escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveVideo(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (activeVideo) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [activeVideo]);

    const activeVidData = videos.find(v => v.id === activeVideo);

    return (
        <>
            {/* Video Player Modal */}
            {activeVideo && activeVidData && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8" 
                    onClick={() => setActiveVideo(null)}
                >
                    <button 
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white hover:text-[#EE2A24] transition-colors z-[110] bg-black/50 p-2 rounded-full backdrop-blur-sm"
                        onClick={() => setActiveVideo(null)}
                        aria-label="Close video"
                    >
                        <X className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                    
                    <div 
                        className="relative w-full max-w-[400px] sm:max-w-4xl aspect-[9/16] sm:aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(238,42,36,0.2)] bg-black/50 border border-stone-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <video 
                            src={activeVidData.src} 
                            autoPlay 
                            controls 
                            playsInline
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            )}

            <section id="videos" className="py-12 sm:py-24 px-4 sm:px-6 bg-black text-white scroll-mt-[var(--header-height)]">
                <AnimateOnScroll className="max-w-6xl mx-auto">
                    <div className="text-center mb-8 sm:mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-[#EE2A24] mb-3 tracking-tight uppercase">
                            Shorts & Reels
                        </h2>
                        <p className="text-white/80 text-base sm:text-lg md:text-xl font-medium max-w-2xl mx-auto px-4">
                            Quick glimpses into our high-energy environment. Watch our community put in the work.
                        </p>
                    </div>

                    {/* Constrained max-width on mobile to prevent videos from becoming too oversized */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 max-w-[280px] min-[400px]:max-w-[340px] sm:max-w-none mx-auto">
                        {videos.map((vid) => (
                            <VideoCard key={vid.id} vid={vid} onClick={() => setActiveVideo(vid.id)} />
                        ))}
                    </div>
                </AnimateOnScroll>
            </section>
        </>
    );
}
