import {useEffect, useState} from "react";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {StatCard} from "./StatCard";
import {CropDistributionChart} from "./CropDistributionChart";
import {WastageReasonChart} from "./WastageReasonChart";
import {AlertTriangle, Database, Loader2, Sprout, TrendingUp} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";

interface FarmerData {
    id: number;
    region: string;
    crop: string;
    area: number;
    yield: number;
    wastage: number;
    reason: string;
    created_at: string;
}

interface AnalyticsData {
    totalSubmissions: number;
    totalYield: number;
    avgWastage: number;
    topCrops: string[];
    cropDistribution: { crop: string; count: number }[];
    wastageReasons: { reason: string; count: number }[];
}

interface AnalyticsDashboardProps {
    refreshKey: number;
}

export function AnalyticsDashboard({refreshKey}: AnalyticsDashboardProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const {profile} = useAuth();

    useEffect(() => {
        if (profile) {
            fetchAnalytics();

            // Set up real-time subscription
            const channel = supabase
                .channel("farmer_data_changes")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "farmer_data",
                    },
                    () => {
                        fetchAnalytics();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [refreshKey, profile]);

    const fetchAnalytics = async () => {
        if (!profile) return;

        try {
            const {data: farmerData, error} = await supabase
                .from("farmer_data")
                .select("*")
                .eq("province", profile.province)
                .order("created_at", {ascending: false});

            if (error) throw error;

            if (!farmerData || farmerData.length === 0) {
                setData({
                    totalSubmissions: 0,
                    totalYield: 0,
                    avgWastage: 0,
                    topCrops: [],
                    cropDistribution: [],
                    wastageReasons: [],
                });
                setIsLoading(false);
                return;
            }

            // Calculate analytics
            const totalSubmissions = farmerData.length;
            const totalYield = farmerData.reduce((sum, item) => sum + Number(item.yield), 0);
            const avgWastage =
                farmerData.reduce((sum, item) => sum + Number(item.wastage), 0) / totalSubmissions;

            // Crop distribution
            const cropCounts: Record<string, number> = {};
            farmerData.forEach((item) => {
                cropCounts[item.crop] = (cropCounts[item.crop] || 0) + 1;
            });

            const cropDistribution = Object.entries(cropCounts).map(([crop, count]) => ({
                crop,
                count,
            }));

            const topCrops = cropDistribution
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map((item) => item.crop);

            // Wastage reasons
            const reasonCounts: Record<string, number> = {};
            farmerData.forEach((item) => {
                reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
            });

            const wastageReasons = Object.entries(reasonCounts).map(([reason, count]) => ({
                reason,
                count,
            }));

            setData({
                totalSubmissions,
                totalYield,
                avgWastage,
                topCrops,
                cropDistribution,
                wastageReasons,
            });
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        );
    }

    if (!data || data.totalSubmissions === 0) {
        return (
            <Card className="shadow-[var(--shadow-card)] border-border/50">
                <CardContent className="py-12 text-center">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground"/>
                    <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
                    <p className="text-muted-foreground">
                        Submit your first crop data to see analytics here.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {profile && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium mb-1">Viewing analytics for:</p>
                        <p className="text-2xl font-bold">{profile.province}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Data from farmers in your province
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Submissions"
                    value={data.totalSubmissions}
                    icon={Database}
                    description="Farmer data entries"
                />
                <StatCard
                    title="Total Harvested"
                    value={`${data.totalYield.toFixed(1)} tons`}
                    icon={TrendingUp}
                    description="Sum of reported harvests"
                />
                <StatCard
                    title="Avg. Wastage"
                    value={`${data.avgWastage.toFixed(1)}%`}
                    icon={AlertTriangle}
                    description="Average crop wastage"
                />
                <Card className="shadow-[var(--shadow-card)] border-border/50 hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Top Crops</p>
                                <div className="space-y-1">
                                    {data.topCrops.map((crop, idx) => (
                                        <p key={idx} className="text-sm font-semibold text-foreground">
                                            {idx + 1}. {crop}
                                        </p>
                                    ))}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                                <Sprout className="h-6 w-6 text-primary"/>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CropDistributionChart data={data.cropDistribution}/>
                <WastageReasonChart data={data.wastageReasons}/>
            </div>
        </div>
    );
}
