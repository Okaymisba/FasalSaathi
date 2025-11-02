import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English
import enHeader from "./locales/en/header.json";
import enLandingPage from "./locales/en/landingPage.json";
import enFooter from "./locales/en/footer.json";
import enDashboard from "./locales/en/dashboard.json";
import enLeaderboard from "./locales/en/leaderboard.json";
import enAuth from "./locales/en/auth.json";

// Urdu (RTL)
import urHeader from "./locales/ur/header.json";
import urLandingPage from "./locales/ur/landingPage.json";
import urFooter from "./locales/ur/footer.json";
import urDashboard from "./locales/ur/dashboard.json";
import urLeaderboard from "./locales/ur/leaderboard.json";
import urAuth from "./locales/ur/auth.json";

// Sindhi (RTL)
import sdHeader from "./locales/sd/header.json";
import sdLandingPage from "./locales/sd/landingPage.json";
import sdFooter from "./locales/sd/footer.json";
import sdDashboard from "./locales/sd/dashboard.json";
import sdLeaderboard from "./locales/sd/leaderboard.json";
import sdAuth from "./locales/sd/auth.json";

// Punjabi (RTL)
import puHeader from "./locales/pu/header.json";
import puLandingPage from "./locales/pu/landingPage.json";
import puFooter from "./locales/pu/footer.json";
import puDashboard from "./locales/pu/dashboard.json";
import puLeaderboard from "./locales/pu/leaderboard.json";
import puAuth from "./locales/pu/auth.json";

export const RTL_LANGS = new Set(["ur", "sd", "pu"]);

function applyDir(lng: string) {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lng;
    document.documentElement.dir = RTL_LANGS.has(lng) ? "rtl" : "ltr";
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                header: enHeader,
                landingPage: enLandingPage,
                footer: enFooter,
                dashboard: enDashboard,
                leaderboard: enLeaderboard,
                auth: enAuth,
            },
            ur: {
                header: urHeader,
                landingPage: urLandingPage,
                footer: urFooter,
                dashboard: urDashboard,
                leaderboard: urLeaderboard,
                auth: urAuth,
            },
            sd: {
                header: sdHeader,
                landingPage: sdLandingPage,
                footer: sdFooter,
                dashboard: sdDashboard,
                leaderboard: sdLeaderboard,
                auth: sdAuth,
            },
            pu: {
                header: puHeader,
                landingPage: puLandingPage,
                footer: puFooter,
                dashboard: puDashboard,
                leaderboard: puLeaderboard,
                auth: puAuth,
            },
        },
        fallbackLng: "en",
        ns: [
            "header",
            "landingPage",
            "footer",
            "dashboard",
            "leaderboard",
            "auth",
        ],
        defaultNS: "header",
        interpolation: {escapeValue: false},
        detection: {
            order: ["querystring", "localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },
    });

// set initial dir and react to changes
applyDir(i18n.resolvedLanguage || i18n.language);
i18n.on("languageChanged", (lng) => applyDir(lng));

export default i18n;
