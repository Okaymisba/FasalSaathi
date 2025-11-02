import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {useTranslation} from "react-i18next";
import {AlertTriangle, Brain, Lightbulb, MapPin, Sprout, TrendingUp} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";

type RegionalData = {
    id: number;
    province: string | null;
    district: string | null;
    crop: string | null;
    ai_summary: string | null;
    fertilizer_tip: string | null;
    next_crop_suggestion: string | null;
    risk_level: string | null;
    market_trend: string | null;
    trend_direction: string | null;
    average_yield: number | null;
    average_wastage: number | null;
    average_efficiency: number | null;
    predicted_next_yield: number | null;
    predicted_wastage_percent: number | null;
    dominant_reason: string | null;
    last_updated: string | null;
};

export function RegionalAIAnalytics() {
    const {profile} = useAuth();
    const {t} = useTranslation("dashboard");
    const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            fetchRegionalData();
        }
    }, [profile]);

    const fetchRegionalData = async () => {
        if (!profile) return;

        setLoading(true);
        try {
            const {data, error} = await (supabase as any)
                .from("Regional_Data")
                .select("*")
                .eq("province", profile.province)
                .eq("district", profile.district);

            if (error) throw error;
            setRegionalData((data as any) || []);
        } catch (error) {
            console.error("Error fetching regional data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full"/>
                <Skeleton className="h-32 w-full"/>
                <Skeleton className="h-32 w-full"/>
            </div>
        );
    }

    if (!regionalData || regionalData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary"/>
                        {t("regionalAI.title")}
                    </CardTitle>
                    <CardDescription>{t("regionalAI.noData")}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4"/>
                <span className="text-sm font-medium">
          {profile?.district}, {profile?.province}
        </span>
            </div>

            {regionalData.map((data) => (
                <Card key={data.id} className="overflow-hidden border-l-4 border-l-primary">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                        <CardTitle className="flex items-center gap-2">
                            <Sprout className="h-5 w-5 text-primary"/>
                            {data.crop ? t(`crops.${data.crop}`, {defaultValue: data.crop}) : t("regionalAI.allCrops")}
                        </CardTitle>
                        {data.last_updated && (
                            <CardDescription className="text-xs">
                                {t("regionalAI.lastUpdated")}: {new Date(data.last_updated).toLocaleDateString()}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {/* AI Summary */}
                        {data.ai_summary && (
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-start gap-3">
                                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0"/>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{t("regionalAI.aiSummary")}</h4>
                                        <p className="text-sm text-muted-foreground">{data.ai_summary}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {data.average_yield && (
                                <div
                                    className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                                    <p className="text-xs text-muted-foreground mb-1">{t("regionalAI.avgYield")}</p>
                                    <p className="text-xl font-bold text-green-700 dark:text-green-400">
                                        {data.average_yield.toFixed(2)} {t("regionalAI.tons")}
                                    </p>
                                </div>
                            )}
                            {data.average_wastage !== null && (
                                <div
                                    className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                                    <p className="text-xs text-muted-foreground mb-1">{t("regionalAI.avgWastage")}</p>
                                    <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
                                        {data.average_wastage.toFixed(1)}%
                                    </p>
                                </div>
                            )}
                            {data.average_efficiency && (
                                <div
                                    className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                                    <p className="text-xs text-muted-foreground mb-1">{t("regionalAI.efficiency")}</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                                        {data.average_efficiency.toFixed(1)}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Risk Level */}
                        {data.risk_level && (
                            <div className={`p-4 rounded-lg border ${
                                data.risk_level.toLowerCase() === 'low'
                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                                    : data.risk_level.toLowerCase() === 'high'
                                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                                        : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
                            }`}>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                        data.risk_level.toLowerCase() === 'low' ? 'text-green-600' :
                                            data.risk_level.toLowerCase() === 'high' ? 'text-red-600' : 'text-yellow-600'
                                    }`}/>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{t("regionalAI.riskLevel")}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {t(`regionalAI.riskLevels.${data.risk_level.toLowerCase()}`)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Market Trend */}
                        {data.market_trend && (
                            <div
                                className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0"/>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{t("regionalAI.marketTrend")}</h4>
                                        <p className="text-sm text-muted-foreground">{data.market_trend}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fertilizer Tip */}
                        {data.fertilizer_tip && (
                            <div
                                className="p-4 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0"/>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{t("regionalAI.fertilizerTip")}</h4>
                                        <p className="text-sm text-muted-foreground">{data.fertilizer_tip}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Next Crop Suggestion */}
                        {data.next_crop_suggestion && (
                            <div
                                className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                                <div className="flex items-start gap-3">
                                    <Sprout className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0"/>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{t("regionalAI.nextCrop")}</h4>
                                        <p className="text-sm text-muted-foreground">{data.next_crop_suggestion}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dominant Wastage Reason */}
                        {data.dominant_reason && (
                            <div className="p-3 rounded-lg bg-muted/50 border">
                                <p className="text-xs text-muted-foreground mb-1">{t("regionalAI.dominantReason")}</p>
                                <p className="text-sm font-medium">{t(`wastageReasons.${data.dominant_reason}`)}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
