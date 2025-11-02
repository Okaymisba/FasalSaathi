import {useState} from "react";
import {FarmerDataForm} from "@/components/FarmerDataForm";
import {AnalyticsDashboard} from "@/components/AnalyticsDashboard";
import {AIInsights} from "@/components/AIInsights";
import {RegionalAIAnalytics} from "@/components/RegionalAIAnalytics";
import {AIChat} from "@/components/AIChat";
import {Navbar} from "@/components/Navbar";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {BarChart3, Brain, MessageSquare, Sprout} from "lucide-react";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";

const Index = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState("submit");
    const {t} = useTranslation("dashboard");

    const handleFormSuccess = () => {
        setRefreshKey((prev) => prev + 1);
        setTimeout(() => {
            setActiveTab("analytics");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
            <Navbar/>

            <main className="container mx-auto px-4 py-8">
                <header className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {t("welcomeTitle")}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {t("welcomeSubtitle")}
                    </p>
                </header>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="relative">
                        <div
                            className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"/>
                        <div className="overflow-x-auto pb-4 scrollbar-hide">
                            <TabsList
                                className="w-full max-w-4xl mx-auto flex gap-1 px-1 py-1.5 bg-muted/30 rounded-lg border border-border/50 min-w-max">
                                <TabsTrigger
                                    value="submit"
                                    className="flex-1 flex flex-col sm:flex-row items-center gap-1.5 text-xs sm:text-sm px-3 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/30 hover:bg-muted/50"
                                >
                                    <Sprout className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                                    <span className="whitespace-nowrap">{t("tabs.submit")}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="ai-analytics"
                                    className="flex-1 flex flex-col sm:flex-row items-center gap-1.5 text-xs sm:text-sm px-3 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/30 hover:bg-muted/50"
                                >
                                    <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                                    <span className="whitespace-nowrap">{t("tabs.aiAnalytics")}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="analytics"
                                    className="flex-1 flex flex-col sm:flex-row items-center gap-1.5 text-xs sm:text-sm px-3 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/30 hover:bg-muted/50"
                                >
                                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                                    <span className="whitespace-nowrap">{t("tabs.analytics")}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="leaderboard"
                                    className="flex-1 flex flex-col sm:flex-row items-center gap-1.5 text-xs sm:text-sm px-3 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/30 hover:bg-muted/50"
                                    asChild
                                >
                                    <Link to="/leaderboard"
                                          className="flex flex-col sm:flex-row items-center gap-1.5 w-full">
                                        <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                                        <span className="whitespace-nowrap">{t("tabs.leaderboard")}</span>
                                    </Link>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="ai-chat"
                                    className="flex-1 flex flex-col sm:flex-row items-center gap-1.5 text-xs sm:text-sm px-3 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/30 hover:bg-muted/50"
                                >
                                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                                    <span className="whitespace-nowrap">{t("tabs.AIChat")}</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div
                            className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"/>
                    </div>

                    <TabsContent value="submit" className="mt-0">
                        <div className="max-w-3xl mx-auto">
                            <FarmerDataForm onSuccess={handleFormSuccess}/>
                        </div>
                    </TabsContent>

                    <TabsContent value="ai-analytics" className="mt-0">
                        <div className="max-w-4xl mx-auto">
                            <RegionalAIAnalytics/>
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-0">
                        <div className="space-y-6">
                            <AIInsights/>
                            <AnalyticsDashboard refreshKey={refreshKey}/>
                        </div>
                    </TabsContent>

                    <TabsContent value="ai-chat" className="mt-0">
                        <div className="max-w-4xl mx-auto">
                            <AIChat/>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Index;

