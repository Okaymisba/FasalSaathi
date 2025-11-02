import {useState} from "react";
import {FarmerDataForm} from "@/components/FarmerDataForm";
import {AnalyticsDashboard} from "@/components/AnalyticsDashboard";
import {AIInsights} from "@/components/AIInsights";
import {AIChat} from "@/components/AIChat";
import {Navbar} from "@/components/Navbar";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {BarChart3, MessageSquare, Sprout} from "lucide-react";
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
                    <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
                        <TabsTrigger value="submit" className="flex items-center gap-2">
                            <Sprout className="h-4 w-4"/>
                            {t("tabs.submit")}
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4"/>
                            {t("tabs.analytics")}
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="flex items-center gap-2" asChild>
                            <Link to="/leaderboard">
                                <BarChart3 className="h-4 w-4"/>
                                {t("tabs.leaderboard")}
                            </Link>
                        </TabsTrigger>
                        <TabsTrigger value="ai-chat" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4"/>
                            {t("tabs.AIChat")}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="submit" className="mt-0">
                        <div className="max-w-3xl mx-auto">
                            <FarmerDataForm onSuccess={handleFormSuccess}/>
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

