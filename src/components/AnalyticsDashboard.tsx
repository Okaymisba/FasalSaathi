import {useEffect, useRef, useState} from "react";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {StatCard} from "./StatCard";
import {CropDistributionChart} from "./CropDistributionChart";
import {WastageReasonChart} from "./WastageReasonChart";
import {AlertTriangle, Database, Loader2, SlidersHorizontal, Sprout, TrendingUp} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {useTranslation} from "react-i18next";

// Crop keys that match the translation keys
const CROP_KEYS = [
    'wheat', 'rice', 'maize', 'barley', 'sorghum', 'millet', 'oats',
    'cotton', 'sugarcane', 'tobacco', 'jute', 'kenaf',
    'chickpea', 'lentil', 'mungbean', 'blackgram', 'peas', 'cowpea', 'pigeonpea',
    'rapeseedmustard', 'mustard', 'canola', 'sunflower', 'sesame', 'groundnut', 'soybean', 'safflower', 'castor',
    'berseem', 'lucerne', 'sorghumsudangrass', 'guineagrass', 'maizefodder',
    'potato', 'onion', 'tomato', 'chili', 'okra', 'cauliflower', 'cabbage', 'brinjal', 'garlic', 'ginger',
    'spinach', 'coriander', 'cucumber', 'carrot', 'radish', 'turnip', 'pumpkin', 'bittergourd', 'bottlegourd',
    'tinda', 'peasvegetable', 'mango', 'citrus', 'banana', 'dates', 'guava', 'apple', 'apricot', 'peach',
    'plum', 'pear', 'pomegranate', 'grapes', 'watermelon', 'muskmelon', 'strawberry', 'turmeric', 'cumin',
    'fennel', 'fenugreek', 'blackpepper', 'cardamom', 'nigella', 'quinoa', 'buckwheat', 'flax', 'teff'
] as const;

type CropKey = typeof CROP_KEYS[number];

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
    const [provinces, setProvinces] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [availableCrops, setAvailableCrops] = useState<CropKey[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
    const [selectedCrop, setSelectedCrop] = useState<string>("All");
    const [pendingProvince, setPendingProvince] = useState<string | null>(null);
    const [pendingDistrict, setPendingDistrict] = useState<string>("All");
    const [pendingCrop, setPendingCrop] = useState<string>("All");
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const filtersContentRef = useRef<HTMLDivElement | null>(null);
    const {t} = useTranslation("dashboard");

    useEffect(() => {
        if (profile) {
            // initialize selected province from profile once profile is ready
            setSelectedProvince((prev) => prev ?? profile.province);
            fetchFilterOptions();
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
                        fetchFilterOptions();
                        fetchAnalytics();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [refreshKey, profile]);

    // Function to apply the selected filters
    const applyFilters = async () => {
        setIsLoading(true);
        setSelectedProvince(pendingProvince);
        setSelectedDistrict(pendingDistrict);
        setSelectedCrop(pendingCrop);

        // Close the filters panel after a short delay to show loading state
        setTimeout(() => {
            setShowFilters(false);
        }, 100);
    };

    // Reset pending filters when closing the filters panel
    const toggleFilters = () => {
        if (showFilters) {
            // Reset pending filters to current selected values when closing
            setPendingProvince(selectedProvince);
            setPendingDistrict(selectedDistrict);
            setPendingCrop(selectedCrop);
        }
        setShowFilters(!showFilters);
    };

    // refetch analytics only when selected filters change (via applyFilters)
    useEffect(() => {
        if (!profile) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                await fetchAnalytics();
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Cleanup function to prevent state updates on unmount
        return () => {
            // Any cleanup if needed
        };
    }, [selectedProvince, selectedDistrict, selectedCrop, profile]);

    // when pending province changes, refresh district options for the dropdown
    useEffect(() => {
        if (!pendingProvince) {
            // If no province is selected, clear districts
            setDistricts([]);
            setPendingDistrict("All");
            return;
        }

        // Fetch districts for the selected province
        const fetchDistrictsForProvince = async () => {
            try {
                const {data: rows, error} = await supabase
                    .from('farmer_data')
                    .select('district')
                    .eq('province', pendingProvince)
                    .not('district', 'is', null);

                if (error) throw error;

                // Extract unique districts and sort them
                const uniqueDistricts = Array.from(
                    new Set(rows.map((r: any) => r.district as string))
                ).sort();

                setDistricts(uniqueDistricts);
                // Reset district selection when province changes
                setPendingDistrict("All");
            } catch (error) {
                console.error('Error fetching districts:', error);
                setDistricts([]);
                setPendingDistrict("All");
            }
        };

        fetchDistrictsForProvince();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingProvince]);

    const fetchFilterOptions = async () => {
        try {
            // fetch minimal columns and dedupe client-side
            const {data: rows, error} = await supabase
                .from("farmer_data")
                .select("province,district,crop");
            if (error) throw error;

            const provSet = new Set<string>();
            const distSet = new Set<string>();
            const cropKeySet = new Set<CropKey>();
            rows?.forEach((r: any) => {
                if (r.province) provSet.add(r.province);
                if (r.district) distSet.add(r.district);
                if (r.crop && CROP_KEYS.includes(r.crop as CropKey)) {
                    cropKeySet.add(r.crop as CropKey);
                }
            });
            const provArr = Array.from(provSet).sort();
            setProvinces(provArr);

            // Sort crops by their translated names
            const sortedCrops = Array.from(cropKeySet).sort((a, b) =>
                t(`crops.${a}`).localeCompare(t(`crops.${b}`))
            );
            setAvailableCrops(sortedCrops);

            // initialize districts based on selected or profile province
            const baseProvince = pendingProvince ?? selectedProvince ?? profile?.province ?? null;
            if (baseProvince) {
                const distForProvince = rows
                    ?.filter((r: any) => r.province === baseProvince && r.district)
                    .map((r: any) => r.district as string);
                setDistricts(Array.from(new Set(distForProvince)).sort());
            } else {
                setDistricts(Array.from(distSet).sort());
            }
        } catch (e) {
            console.error("Error fetching filter options:", e);
        }
    };

    const fetchDistrictOptions = async (province: string) => {
        try {
            let query = supabase
                .from("farmer_data")
                .select('district')
                .not('district', 'is', null);

            if (province && province !== 'All') {
                query = query.eq('province', province);
            }

            const {data: rows, error} = await query
                .select("district, province");

            if (error) throw error;

            const dists = Array.from(new Set(
                (rows || [])
                    .map((r: any) => r.district)
                    .filter(Boolean)
            )).sort();

            setDistricts(dists);
        } catch (e) {
            console.error("Error fetching district options:", e);
        }
    };

    const fetchAnalytics = async () => {
        if (!profile) return;

        console.log('Fetching analytics with filters:', {
            province: selectedProvince,
            district: selectedDistrict,
            crop: selectedCrop
        });

        try {
            let query = supabase
                .from("farmer_data")
                .select("*")
                .order("created_at", {ascending: false});

            // Apply province filter if selected
            if (selectedProvince) {
                query = query.eq("province", selectedProvince);
            }

            // Apply district filter if selected and not "All"
            if (selectedDistrict && selectedDistrict !== "All") {
                query = query.eq("district", selectedDistrict);
            }

            // Apply crop filter if selected and not "All"
            if (selectedCrop && selectedCrop !== "All") {
                query = query.eq("crop", selectedCrop);
            }

            const {data: farmerData, error} = await query;

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

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        );
    }

    // Show no data message but keep the filters visible
    const showNoData = !data || data.totalSubmissions === 0;

    return (
        <div className="space-y-6">
            {profile && (
                <div
                    className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0">{t("analytics.scopeLabel")}</span>
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground truncate">
                            <span
                                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs truncate max-w-[40vw]">
                                {selectedProvince ?? profile.province}
                            </span>
                            {selectedDistrict && selectedDistrict !== "All" && (
                                <span
                                    className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-foreground text-xs truncate max-w-[30vw]">
                                    {selectedDistrict}
                                </span>
                            )}
                            {selectedCrop && selectedCrop !== "All" && (
                                <span
                                    className="inline-flex items-center rounded-full bg-secondary/20 px-2 py-0.5 text-foreground text-xs truncate max-w-[30vw]">
                                    {selectedCrop}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={toggleFilters}>
                        <SlidersHorizontal
                            className={`h-4 w-4 transition-transform duration-300 ${showFilters ? "rotate-90" : "rotate-0"}`}/>
                        {showFilters ? t("analytics.filters.hide") : t("analytics.filters.show")}
                    </Button>
                </div>
            )}
            <div
                className="transition-all duration-300 ease-out overflow-hidden"
                style={{
                    maxHeight: showFilters ? (filtersContentRef.current?.scrollHeight || 0) : 0,
                    opacity: showFilters ? 1 : 0,
                    transform: showFilters ? "translateY(0)" : "translateY(-6px)",
                }}
                aria-hidden={!showFilters}
            >
                <Card className="shadow-[var(--shadow-card)] border-border/50">
                    <CardContent className="pt-6" ref={filtersContentRef}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>{t("analytics.filters.province")}</Label>
                                <Select
                                    value={pendingProvince ?? ""}
                                    onValueChange={(v) => setPendingProvince(v || null)}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder={t("analytics.filters.placeholders.province")}/>
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover z-50">
                                        {provinces.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{t("analytics.filters.district")}</Label>
                                <Select
                                    value={pendingDistrict}
                                    onValueChange={(v) => setPendingDistrict(v)}
                                    disabled={!pendingProvince}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder={t("analytics.filters.placeholders.all")}/>
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover z-50">
                                        <SelectItem value="All">{t("analytics.filters.placeholders.all")}</SelectItem>
                                        {districts.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{t("analytics.filters.crop")}</Label>
                                <Select
                                    value={pendingCrop}
                                    onValueChange={(v) => setPendingCrop(v)}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder={t("analytics.filters.placeholders.all")}/>
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover z-50">
                                        <SelectItem value="All">{t("analytics.filters.placeholders.all")}</SelectItem>
                                        {availableCrops.map((cropKey) => (
                                            <SelectItem key={cropKey} value={cropKey}>
                                                {t(`crops.${cropKey}`, cropKey)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Apply Filters Button */}
                            <div className="col-span-full flex justify-end space-x-3 pt-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setSelectedProvince(pendingProvince);
                                        setSelectedDistrict(pendingDistrict);
                                        setSelectedCrop(pendingCrop);
                                        setShowFilters(false);
                                    }}
                                    className="px-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            {t("analytics.filters.buttons.applying")}
                                        </>
                                    ) : (
                                        t("analytics.filters.buttons.apply")
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title={t("analytics.stats.totalSubmissions.title")}
                    value={data.totalSubmissions}
                    icon={Database}
                    description={t("analytics.stats.totalSubmissions.desc")}
                />
                <StatCard
                    title={t("analytics.stats.totalHarvested.title")}
                    value={`${data.totalYield.toFixed(1)} ${t("analytics.stats.totalHarvested.valueSuffixTons")}`}
                    icon={TrendingUp}
                    description={t("analytics.stats.totalHarvested.desc")}
                />
                <StatCard
                    title={t("analytics.stats.avgWastage.title")}
                    value={`${data.avgWastage.toFixed(1)}%`}
                    icon={AlertTriangle}
                    description={t("analytics.stats.avgWastage.desc")}
                />
                <Card className="shadow-[var(--shadow-card)] border-border/50 hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">{t("analytics.topCrops.title")}</p>
                                <div className="space-y-1">
                                    {data.topCrops.map((crop, idx) => {
                                        const translatedCrop = t(`crops.${crop}`, {defaultValue: crop});
                                        return (
                                            <p key={idx} className="text-sm font-semibold text-foreground">
                                                {idx + 1}. {translatedCrop}
                                            </p>
                                        );
                                    })}
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

