import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {supabase} from "@/integrations/supabase/client";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {AlertTriangle, CheckCircle2, Loader2, Sprout} from "lucide-react";
import {useAuth} from "@/hooks/useAuth";

interface AnalysisResult {
    predicted_yield_kg: number | null;
    predicted_wastage_percent: number | null;
    disease_risk_level: string | null;
    irrigation_need_in_days: number | null;
    fertilizer_recommendation: string | null;
    next_crop_suggestion: string | null;
}

interface InsightMessage {
    type: "success" | "warning" | "info";
    message: string;
}

export const AIInsights = () => {
    const {t, i18n} = useTranslation("dashboard");
    const {user} = useAuth();
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<InsightMessage[]>([]);
    const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchAnalysisResults = async () => {
            try {
                const {data, error} = await (supabase as any)
                    .from("analysis_results")
                    .select("*")
                    .eq("farmer_id", user.id)
                    .order("analysis_date", {ascending: false})
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setAnalysisData(data as unknown as AnalysisResult);
                }
            } catch (error) {
                console.error("Error fetching analysis results:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysisResults();
    }, [user]);

    // Regenerate insights when language changes or when analysis data changes
    useEffect(() => {
        if (analysisData) {
            const generatedInsights = generateInsights(analysisData);
            setInsights(generatedInsights);
        }
    }, [analysisData, i18n.language, t]);

    const generateInsights = (result: AnalysisResult): InsightMessage[] => {
        const messages: InsightMessage[] = [];

        // Predicted yield insights
        if (result.predicted_yield_kg !== null) {
            if (result.predicted_yield_kg > 5000) {
                messages.push({
                    type: "success",
                    message: t("analytics.aiInsights.yieldHigh"),
                });
            } else if (result.predicted_yield_kg < 3000) {
                messages.push({
                    type: "warning",
                    message: t("analytics.aiInsights.yieldLow"),
                });
            }
        }

        // Wastage insights
        if (result.predicted_wastage_percent !== null && result.predicted_wastage_percent > 10) {
            messages.push({
                type: "warning",
                message: t("analytics.aiInsights.wastageHigh"),
            });
        }

        // Disease risk insights
        if (result.disease_risk_level === "Low") {
            messages.push({
                type: "success",
                message: t("analytics.aiInsights.diseaseRiskLow"),
            });
        }

        // Irrigation insights
        if (
            result.irrigation_need_in_days !== null &&
            result.irrigation_need_in_days >= 15 &&
            result.irrigation_need_in_days <= 20
        ) {
            messages.push({
                type: "info",
                message: t("analytics.aiInsights.irrigationSchedule", {
                    days: result.irrigation_need_in_days,
                }),
            });
        }

        // Fertilizer recommendation
        if (result.fertilizer_recommendation) {
            messages.push({
                type: "info",
                message: t("analytics.aiInsights.fertilizerPlan", {
                    plan: result.fertilizer_recommendation,
                }),
            });
        }

        // Next crop suggestion
        if (result.next_crop_suggestion) {
            const translatedCrop = t(`crops.${result.next_crop_suggestion}`, {
                defaultValue: result.next_crop_suggestion,
            });
            messages.push({
                type: "info",
                message: t("analytics.aiInsights.nextCropSuggestion", {
                    crop: translatedCrop,
                }),
            });
        }

        return messages;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400"/>;
            case "warning":
                return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400"/>;
            case "info":
                return <Sprout className="h-5 w-5 text-blue-600 dark:text-blue-400"/>;
            default:
                return null;
        }
    };

    const getCardStyle = (type: string) => {
        switch (type) {
            case "success":
                return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
            case "warning":
                return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800";
            case "info":
                return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
            default:
                return "";
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t("analytics.aiInsights.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (insights.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t("analytics.aiInsights.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">
                        {t("analytics.aiInsights.noInsights")}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t("analytics.aiInsights.title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {insights.map((insight, index) => (
                        <div
                            key={index}
                            className={`flex items-start gap-3 p-4 rounded-lg border ${getCardStyle(
                                insight.type
                            )}`}
                        >
                            <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>
                            <p className="text-sm leading-relaxed text-foreground">{insight.message}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
