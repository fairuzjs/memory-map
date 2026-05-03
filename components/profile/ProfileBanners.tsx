import React from "react"

export function GalaxyBanner() {
    return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="480" cy="55" rx="180" ry="55" fill="rgba(180,100,255,0.18)" className="nebula-drift" style={{ filter: "blur(20px)" }} />
            <ellipse cx="160" cy="95" rx="140" ry="40" fill="rgba(80,120,255,0.15)" className="nebula-drift" style={{ animationDelay: "-6s", filter: "blur(18px)" }} />
            <ellipse cx="670" cy="110" rx="120" ry="35" fill="rgba(150,60,255,0.12)" className="nebula-drift" style={{ animationDelay: "-10s", filter: "blur(16px)" }} />
            <circle cx="30" cy="12" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "2.1s", "--r0": "1.5", "--r1": "2.5" } as any} />
            <circle cx="95" cy="25" r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "1.7s", "--r0": "1.0", "--r1": "2.0" } as any} />
            <circle cx="160" cy="8" r="1.6" fill="white" className="star-twinkle" style={{ "--dur": "2.8s", "--r0": "1.2", "--r1": "2.2" } as any} />
            <circle cx="230" cy="40" r="1.1" fill="#aad4ff" className="star-twinkle" style={{ "--dur": "1.5s", "--r0": "0.9", "--r1": "1.6" } as any} />
            <circle cx="290" cy="18" r="1.4" fill="white" className="star-twinkle" style={{ "--dur": "2.4s", "--r0": "1.1", "--r1": "2.0" } as any} />
            <circle cx="350" cy="55" r="1.0" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "1.9s", "--r0": "0.8", "--r1": "1.5" } as any} />
            <circle cx="410" cy="10" r="1.7" fill="white" className="star-twinkle" style={{ "--dur": "3.0s", "--r0": "1.3", "--r1": "2.3" } as any} />
            <circle cx="470" cy="30" r="1.2" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.2s", "--r0": "1.0", "--r1": "1.8" } as any} />
            <circle cx="530" cy="15" r="1.5" fill="white" className="star-twinkle" style={{ "--dur": "1.6s", "--r0": "1.2", "--r1": "2.1" } as any} />
            <circle cx="590" cy="48" r="1.0" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.6s", "--r0": "0.8", "--r1": "1.5" } as any} />
            <circle cx="650" cy="20" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "1.4s", "--r0": "1.4", "--r1": "2.4" } as any} />
            <circle cx="710" cy="9" r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.9s", "--r0": "1.0", "--r1": "1.9" } as any} />
            <circle cx="770" cy="35" r="1.1" fill="white" className="star-twinkle" style={{ "--dur": "2.0s", "--r0": "0.9", "--r1": "1.6" } as any} />
            <circle cx="55" cy="80" r="1.0" fill="white" className="star-twinkle" style={{ "--dur": "1.8s", "--r0": "0.8", "--r1": "1.4" } as any} />
            <circle cx="200" cy="100" r="1.4" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "2.5s", "--r0": "1.1", "--r1": "2.0" } as any} />
            <circle cx="370" cy="90" r="1.2" fill="white" className="star-twinkle" style={{ "--dur": "1.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
            <circle cx="500" cy="115" r="1.5" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.7s", "--r0": "1.2", "--r1": "2.2" } as any} />
            <circle cx="680" cy="95" r="1.1" fill="white" className="star-twinkle" style={{ "--dur": "1.6s", "--r0": "0.9", "--r1": "1.6" } as any} />
            <circle cx="785" cy="120" r="1.3" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
        </svg>
    )
}

export function SamudraBanner() {
    return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs><filter id="blur-aurora-profile"><feGaussianBlur stdDeviation="8" /></filter></defs>
            <rect x="-20" y="15" width="840" height="32" rx="16" fill="rgba(120,60,255,0.28)" className="aurora-wave" filter="url(#blur-aurora-profile)"
                style={{ "--dur": "7s", "--op0": "0.25", "--op1": "0.55" } as any} />
            <rect x="-20" y="52" width="840" height="22" rx="11" fill="rgba(60,180,255,0.22)" className="aurora-wave" filter="url(#blur-aurora-profile)"
                style={{ "--dur": "5.5s", "--op0": "0.2", "--op1": "0.5", animationDelay: "-2s" } as any} />
            <rect x="-20" y="80" width="840" height="24" rx="12" fill="rgba(200,50,255,0.18)" className="aurora-wave" filter="url(#blur-aurora-profile)"
                style={{ "--dur": "9s", "--op0": "0.15", "--op1": "0.4", animationDelay: "-4s" } as any} />
            {[[20, 10, 1.8, "#fff", "2.0s"], [80, 5, 1.4, "#aaddff", "1.4s"], [145, 18, 2.0, "#fff", "2.6s"], [205, 8, 1.2, "#ddbbff", "1.8s"], [260, 22, 1.7, "#fff", "1.2s"], [320, 12, 1.5, "#aaddff", "2.3s"], [380, 7, 2.1, "#fff", "0.9s"], [440, 25, 1.3, "#ffccee", "1.7s"], [500, 10, 1.6, "#fff", "2.1s"], [560, 20, 1.1, "#cceeff", "1.5s"], [620, 6, 1.8, "#fff", "2.8s"], [680, 15, 1.4, "#ddbbff", "1.1s"], [740, 8, 1.7, "#fff", "1.9s"], [790, 22, 1.0, "#aaddff", "2.4s"], [50, 90, 1.3, "#fff", "1.6s"], [130, 105, 1.5, "#ffccee", "0.8s"], [220, 95, 1.1, "#fff", "2.2s"], [310, 110, 1.8, "#ccddff", "1.3s"], [400, 100, 1.4, "#fff", "2.7s"], [490, 115, 1.2, "#aaddff", "1.0s"], [580, 95, 1.6, "#fff", "2.5s"], [670, 108, 1.3, "#ffccee", "1.8s"], [760, 100, 1.0, "#fff", "1.2s"], [110, 50, 1.4, "#fff", "2.1s"], [350, 65, 1.2, "#ddbbff", "1.6s"], [600, 55, 1.5, "#fff", "2.4s"]].map(([cx, cy, r, fill, dur], i) => (
                <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} className="star-shimmer" style={{ "--dur": dur } as any} />
            ))}
        </svg>
    )
}

export function HutanBanner() {
    return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 140" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            <rect x="18" y="0" width="15" rx="2" fill="#00cc55" opacity="0.75" className="eq-bar eq-bar-1" />
            <rect x="42" y="0" width="15" rx="2" fill="#00cc55" opacity="0.65" className="eq-bar eq-bar-2" />
            <rect x="66" y="0" width="15" rx="2" fill="#00bb44" opacity="0.85" className="eq-bar eq-bar-3" />
            <rect x="90" y="0" width="15" rx="2" fill="#00cc55" opacity="0.70" className="eq-bar eq-bar-4" />
            <rect x="114" y="0" width="15" rx="2" fill="#00bb44" opacity="0.60" className="eq-bar eq-bar-5" />
            <rect x="138" y="0" width="15" rx="2" fill="#00aa33" opacity="0.55" className="eq-bar eq-bar-6" />
        </svg>
    )
}

export function PremiumRoyalBanner() {
    return (
        <>
            {/* Neubrutalism grid pattern */}
            <div className="absolute inset-0" style={{
                backgroundImage: "linear-gradient(rgba(255,215,0,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(255,215,0,0.08) 2px, transparent 2px)",
                backgroundSize: "24px 24px",
            }} />

            {/* Thick horizontal gold stripes — animated glow */}
            <div className="absolute top-[18%] left-0 right-0 h-[6px] neoban-stripe-pulse" style={{ background: "#ffd700", boxShadow: "0 3px 0 #000" }} />
            <div className="absolute bottom-[22%] left-0 right-0 h-[4px] neoban-stripe-pulse" style={{ background: "#b8860b", boxShadow: "0 2px 0 #000", animationDelay: "1s" }} />

            {/* Geometric crown shape — left (animated float) */}
            <div className="absolute top-[15%] left-[8%] w-10 h-10 sm:w-12 sm:h-12 neoban-float-a" style={{
                background: "#ffd700",
                border: "3px solid #000",
                boxShadow: "3px 3px 0 #000",
            }} />
            <div className="absolute top-[20%] left-[10%] w-6 h-6 sm:w-7 sm:h-7 neoban-float-b" style={{
                background: "#fff5cc",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #b8860b",
            }} />

            {/* Crown icon — center (animated pulse) */}
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center neoban-crown-pulse" style={{
                background: "#ffd700",
                border: "3px solid #000",
                boxShadow: "3px 3px 0 #000",
            }}>
                <span className="text-lg sm:text-xl select-none" style={{ filter: "drop-shadow(1px 1px 0 #b8860b)" }}>👑</span>
            </div>

            {/* Diamond shapes — right (animated float) */}
            <div className="absolute top-[12%] right-[12%] w-8 h-8 sm:w-10 sm:h-10 neoban-spin-slow" style={{
                background: "#b8860b",
                border: "3px solid #000",
                boxShadow: "3px 3px 0 #000",
            }} />
            <div className="absolute bottom-[18%] right-[8%] w-5 h-5 neoban-float-c" style={{
                background: "#ffd700",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
            }} />

            {/* Small accent blocks (animated) */}
            <div className="absolute bottom-[30%] left-[22%] w-3 h-3 sm:w-4 sm:h-4 neoban-float-b" style={{
                background: "#fff5cc",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #b8860b",
            }} />
            <div className="absolute top-[35%] right-[25%] w-3 h-3 sm:w-3.5 sm:h-3.5 neoban-float-a" style={{
                background: "#ffd700",
                border: "2px solid #000",
                boxShadow: "1px 1px 0 #000",
                animationDelay: "0.5s",
            }} />

            {/* "PREMIUM" text stamp — centered below crown */}
            <div className="absolute top-[68%] left-[50%] -translate-x-1/2 px-2 py-px neoban-stamp-glow" style={{
                background: "#000",
                border: "1.5px solid #ffd700",
                boxShadow: "1px 1px 0 #b8860b",
            }}>
                <span className="text-[6px] sm:text-[7px] font-black tracking-[0.2em] uppercase" style={{ color: "#ffd700" }}>★ PREMIUM ★</span>
            </div>

            {/* Star accents (animated twinkle) */}
            <div className="absolute top-[10%] left-[40%] text-[10px] font-black select-none neoban-twinkle" style={{ color: "#ffd700", textShadow: "1px 1px 0 #000" }}>✦</div>
            <div className="absolute top-[60%] left-[18%] text-[8px] font-black select-none neoban-twinkle" style={{ color: "#b8860b", textShadow: "1px 1px 0 #000", animationDelay: "0.8s" }}>✦</div>
            <div className="absolute top-[25%] right-[32%] text-[12px] font-black select-none neoban-twinkle" style={{ color: "#fff5cc", textShadow: "1px 1px 0 #000", animationDelay: "1.6s" }}>✦</div>
            <div className="absolute bottom-[35%] right-[18%] text-[9px] font-black select-none neoban-twinkle" style={{ color: "#ffd700", textShadow: "1px 1px 0 #000", animationDelay: "2.4s" }}>★</div>
        </>
    )
}
