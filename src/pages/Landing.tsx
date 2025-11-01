import {useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Navbar} from "@/components/Navbar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {BarChart3, Globe, Sprout} from "lucide-react";
import {useAuth} from "@/hooks/useAuth";

const Landing = () => {
    const {t} = useTranslation("landingPage");
    const navigate = useNavigate();
    const {user, loading} = useAuth();
    const featuresRef = useRef<HTMLDivElement | null>(null);

    const goPrimary = () => {
        navigate(user ? "/app" : "/auth");
    };

    const scrollToFeatures = () => {
        featuresRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
    };

    useEffect(() => {
        if (!loading && user) {
            navigate("/app", {replace: true});
        }
    }, [loading, user, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
            <Navbar/>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_80%_-10%,hsl(var(--primary)/0.15),transparent),radial-gradient(30rem_16rem_at_20%_10%,hsl(var(--accent)/0.12),transparent)] pointer-events-none"/>
                <div className="container mx-auto px-4 pt-12 pb-16 md:pt-16 md:pb-24">
                    <div className="max-w-3xl mx-auto text-center">
                        <div
                            className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur mb-4">
                            <Sprout className="mr-2 h-4 w-4 text-primary"/>
                            Sindh Agri Scope
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {t("title")}
                        </h1>
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
                            {t("subtitle")}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button size="lg" onClick={goPrimary} className="w-full sm:w-auto shadow-sm">
                                {t("primaryCta")}
                            </Button>
                            <Button size="lg" variant="outline" onClick={scrollToFeatures} className="w-full sm:w-auto">
                                {t("secondaryCta")}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section ref={featuresRef} className="container mx-auto px-4 pb-16 md:pb-24">
                <header className="text-center mb-10 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("featuresTitle")}</h2>
                    <p className="text-muted-foreground">{t("featuresSubtitle")}</p>
                </header>

                <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
                    <Card className="transition-all hover:shadow-md">
                        <CardHeader>
                            <div
                                className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2">
                                <Sprout className="h-5 w-5"/>
                            </div>
                            <CardTitle className="text-lg">{t("features.dataCollection.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            {t("features.dataCollection.desc")}
                        </CardContent>
                    </Card>

                    <Card className="transition-all hover:shadow-md">
                        <CardHeader>
                            <div
                                className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2">
                                <BarChart3 className="h-5 w-5"/>
                            </div>
                            <CardTitle className="text-lg">{t("features.analytics.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            {t("features.analytics.desc")}
                        </CardContent>
                    </Card>

                    <Card className="transition-all hover:shadow-md">
                        <CardHeader>
                            <div
                                className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2">
                                <Globe className="h-5 w-5"/>
                            </div>
                            <CardTitle className="text-lg">{t("features.localization.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            {t("features.localization.desc")}
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* CTA footer */}
            <section className="container mx-auto px-4 pb-20">
                <div
                    className="rounded-xl border border-border/60 bg-gradient-to-r from-primary/10 via-background to-accent/10 p-6 md:p-8 text-center">
                    <h3 className="text-xl md:text-2xl font-semibold mb-2">{t("ctaTitle")}</h3>
                    <p className="text-muted-foreground mb-4">{t("ctaSubtitle")}</p>
                    <Button size="lg" onClick={goPrimary}>{t("primaryCta")}</Button>
                </div>
            </section>
        </div>
    );
};

export default Landing;
