import {ReactNode, useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {motion, Variants} from "framer-motion";
import {Navbar} from "@/components/Navbar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
    ArrowRight,
    BarChart3,
    CloudRain,
    Droplet,
    Globe,
    Leaf,
    Shield,
    Smartphone,
    Sprout,
    TrendingUp,
    WifiOff
} from "lucide-react";
import {useAuth} from "@/hooks/useAuth";

interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    delay?: number;
}

interface FarmerBenefitProps {
    icon: ReactNode;
    title: string;
    description: string;
}

const fadeInUp: Variants = {
    hidden: {opacity: 0, y: 20},
    visible: {
        opacity: 1,
        y: 0,
        transition: {duration: 0.6}
    }
};

const staggerContainer: Variants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const FeatureCard: React.FC<FeatureCardProps> = ({
                                                     icon: Icon,
                                                     title,
                                                     description,
                                                     delay = 0
                                                 }) => (
    <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
        transition={{delay: delay * 0.1}}
        className="h-full"
    >
        <Card className="h-full transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden group">
            <CardHeader className="pb-2">
                <div
                    className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5"/>
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    </motion.div>
);

const FarmerBenefit: React.FC<FarmerBenefitProps> = ({
                                                         icon,
                                                         title,
                                                         description
                                                     }) => (
    <motion.div
        className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
        initial={{opacity: 0, y: 20}}
        whileInView={{opacity: 1, y: 0}}
        viewport={{once: true}}
        transition={{duration: 0.5}}
    >
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground mt-1">{description}</p>
        </div>
    </motion.div>
);

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
        <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
            <Navbar/>

            {/* Hero Section */}
            <section
                className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="absolute inset-0 -z-10">
                    <div
                        className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_80%_-10%,hsl(var(--primary)/0.08),transparent),radial-gradient(30rem_16rem_at_20%_10%,hsl(var(--accent)/0.08),transparent)]"/>
                    <div
                        className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>
                </div>

                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <motion.div
                            className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur mb-6"
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.2, duration: 0.5}}
                        >
                            <Sprout className="mr-2 h-4 w-4 text-primary"/>
                            {t("appName")}
                        </motion.div>

                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {t("title")}
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                            {t("subtitle")}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={goPrimary}
                                className="w-full sm:w-auto shadow-lg hover:shadow-primary/20 transition-all"
                            >
                                {t("primaryCta")} <Smartphone className="ml-2 h-4 w-4"/>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={scrollToFeatures}
                                className="w-full sm:w-auto"
                            >
                                {t("secondaryCta")}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Farmer Benefits */}
            <section className="py-16 md:py-24 bg-background/50">
                <div className="container mx-auto px-4">
                    <motion.div
                        className="text-center mb-16"
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.6}}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Empowering Farmers in Sindh</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Modern solutions for traditional farming challenges
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <FarmerBenefit
                            icon={<Leaf className="h-5 w-5"/>}
                            title="Crop Monitoring"
                            description="Track your crop growth and health with real-time updates and personalized recommendations."
                        />
                        <FarmerBenefit
                            icon={<CloudRain className="h-5 w-5"/>}
                            title="Weather Alerts"
                            description="Get accurate weather forecasts and alerts to protect your crops from adverse conditions."
                        />
                        <FarmerBenefit
                            icon={<Droplet className="h-5 w-5"/>}
                            title="Water Management"
                            description="Optimize water usage with smart irrigation recommendations based on your field conditions."
                        />
                        <FarmerBenefit
                            icon={<Shield className="h-5 w-5"/>}
                            title="Pest & Disease Control"
                            description="Identify and manage pests and diseases with our AI-powered diagnostic tools."
                        />
                        <FarmerBenefit
                            icon={<TrendingUp className="h-5 w-5"/>}
                            title="Market Prices"
                            description="Access real-time market prices to get the best value for your produce."
                        />
                        <FarmerBenefit
                            icon={<WifiOff className="h-5 w-5"/>}
                            title="Works Offline"
                            description="Access all features on your smartphone, even with limited internet connectivity."
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section ref={featuresRef} className="py-16 md:py-24 bg-secondary/5">
                <div className="container mx-auto px-4">
                    <motion.div
                        className="text-center mb-16"
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.6}}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("featuresTitle")}</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            {t("featuresSubtitle")}
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{once: true}}
                    >
                        <FeatureCard
                            icon={Sprout}
                            title={t("features.dataCollection.title")}
                            description={t("features.dataCollection.desc")}
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title={t("features.analytics.title")}
                            description={t("features.analytics.desc")}
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={Globe}
                            title={t("features.localization.title")}
                            description={t("features.localization.desc")}
                            delay={0.3}
                        />
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        className="max-w-3xl mx-auto bg-background/80 backdrop-blur-sm p-8 md:p-10 rounded-2xl border border-border/50 shadow-lg"
                        initial={{opacity: 0, scale: 0.98}}
                        whileInView={{opacity: 1, scale: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                    >
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to transform your farming
                            experience?</h2>
                        <p className="text-muted-foreground mb-8">
                            Join thousands of farmers in Sindh who are already benefiting from our platform.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={goPrimary}
                                className="shadow-lg hover:shadow-primary/20 transition-all"
                            >
                                {t("primaryCta")} <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={scrollToFeatures}
                            >
                                Learn More
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

// Add this to your translations in the respective language files:
// "tagline": "Empowering Farmers in Sindh"

export default Landing;
