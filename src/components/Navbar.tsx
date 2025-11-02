import {Link, useNavigate} from "react-router-dom";
import {LogOut, Sprout} from "lucide-react";
import {useAuth} from "@/hooks/useAuth";
import {toast} from "sonner";
import {useTranslation} from "react-i18next";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
    const navigate = useNavigate();
    const {profile, signOut} = useAuth();
    const {t, i18n} = useTranslation("header");

    const handleSignOut = async () => {
        await signOut();
        toast.success(t("loggedOutSuccess"));
        navigate("/auth");
    };

    const currentLng = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

    return (
        <nav
            className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Sprout className="h-6 w-6 text-primary"/>
                        <div>
                            <h1 className="text-xl font-bold">{t("appName")}</h1>
                            <p className="text-xs text-muted-foreground">{t("tagline")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/app" className="text-sm font-medium transition-colors hover:text-primary">
                                {t("nav.dashboard")}
                            </Link>
                            <Link to="/leaderboard" className="text-sm font-medium transition-colors hover:text-primary">
                                {t("nav.leaderboard")}
                            </Link>
                        </div>
                        
                        <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-xs text-muted-foreground">{t("language")}</div>
                        <Select value={currentLng} onValueChange={(v) => i18n.changeLanguage(v)}>
                            <SelectTrigger className="h-9 w-[110px]">
                                <SelectValue aria-label={currentLng}>
                                    {currentLng === "en" && t("languages.en")}
                                    {currentLng === "ur" && t("languages.ur")}
                                    {currentLng === "sd" && t("languages.sd")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">{t("languages.en")}</SelectItem>
                                <SelectItem value="ur">{t("languages.ur")}</SelectItem>
                                <SelectItem value="sd">{t("languages.sd")}</SelectItem>
                            </SelectContent>
                        </Select>

                        {profile && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className="hidden md:flex flex-col items-end leading-tight">
                                            <span
                                                className="text-sm font-medium max-w-[160px] truncate">{profile.name}</span>
                                            <span
                                                className="text-xs text-muted-foreground max-w-[160px] truncate">{profile.province}</span>
                                        </div>
                                        <Avatar>
                                            <AvatarFallback>
                                                {profile.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("") || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{profile.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{profile.province}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem onSelect={(e) => {
                                        e.preventDefault();
                                        handleSignOut();
                                    }}>
                                        <LogOut className="mr-2 h-4 w-4"/>
                                        <span>{t("logout")}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

