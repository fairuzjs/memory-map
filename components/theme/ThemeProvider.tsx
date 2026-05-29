"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, type ThemeConfig } from "./themes"

// ═══════════════════════════════════════════════════════════════════════
// Theme Context — Memory Map
// ═══════════════════════════════════════════════════════════════════════

interface ThemeContextValue {
    theme: string
    setTheme: (themeId: string) => void
    themes: ThemeConfig[]
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
    return ctx
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState(DEFAULT_THEME)
    const [mounted, setMounted] = useState(false)

    // Read theme from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY)
            if (stored && THEMES.some(t => t.id === stored)) {
                setThemeState(stored)
                document.documentElement.dataset.theme = stored
            } else {
                document.documentElement.dataset.theme = DEFAULT_THEME
            }
        } catch {
            document.documentElement.dataset.theme = DEFAULT_THEME
        }
        setMounted(true)
    }, [])

    const setTheme = (themeId: string) => {
        if (!THEMES.some(t => t.id === themeId)) return
        setThemeState(themeId)
        document.documentElement.dataset.theme = themeId
        try {
            localStorage.setItem(THEME_STORAGE_KEY, themeId)
        } catch {
            // localStorage might be unavailable
        }
    }

    // Prevent hydration mismatch by not rendering until mounted
    // But we still render children to avoid layout shift — the inline script
    // in layout.tsx handles the initial theme application before paint
    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    )
}
