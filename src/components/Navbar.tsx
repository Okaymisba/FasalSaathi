import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {LogOut, Sprout} from "lucide-react";
import {useAuth} from "@/hooks/useAuth";
import {toast} from "sonner";
import {useTranslation} from "react-i18next";

export function Navbar() {
    const navigate = useNavigate();
    const {profile, signOut} = useAuth();
    const {t, i18n} = useTranslation("header");

    const handleSignOut = async () => {
        await signOut();
        toast.success(t("loggedOutSuccess"));
        navigate("/auth");
    };

    return (
        <nav
            className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sprout className="h-6 w-6 text-primary"/>
                        <div>
                            <h1 className="text-xl font-bold">{t("appName")}</h1>
                            <p className="text-xs text-muted-foreground">{t("tagline")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-xs text-muted-foreground hidden sm:block" htmlFor="lang-select">
                            {t("language")}
                        </label>
                        <select
                            id="lang-select"
                            className="border border-border bg-background rounded-md px-2 py-1 text-sm"
                            value={i18n.resolvedLanguage || i18n.language}
                            onChange={(e) => i18n.changeLanguage(e.target.value)}
                        >
                            <option value="en">{t("languages.en")}</option>
                            <option value="ur">{t("languages.ur")}</option>
                            <option value="sd">{t("languages.sd")}</option>
                        </select>

                        {profile && (
                            <>
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium">{profile.name}</p>
                                    <p className="text-xs text-muted-foreground">{profile.province}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleSignOut}>
                                    <LogOut className="h-4 w-4 mr-2"/>
                                    {t("logout")}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

