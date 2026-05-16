/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            keyframes: {
                "modal-in": {
                    "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
                    "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
                },
                "modal-out": {
                    "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
                    "100%": { opacity: "0", transform: "translateY(4px) scale(0.98)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "fade-out": {
                    "0%": { opacity: "1" },
                    "100%": { opacity: "0" },
                },
                "slide-fade-in": {
                    "0%": { opacity: "0", transform: "translateY(-6px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "modal-in": "modal-in 180ms ease-out both",
                "modal-out": "modal-out 140ms ease-in both",
                "fade-in": "fade-in 180ms ease-out both",
                "fade-out": "fade-out 140ms ease-in both",
                "slide-fade-in": "slide-fade-in 180ms ease-out both",
            },
        },
    },
    plugins: [],
};
