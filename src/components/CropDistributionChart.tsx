import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useTranslation} from "react-i18next";

interface CropData {
    crop: string;
    count: number;
}

interface CropDistributionChartProps {
    data: CropData[];
}

export function CropDistributionChart({data}: CropDistributionChartProps) {
    const {t} = useTranslation("dashboard");
    
    // Map the data to include translated crop names
    const translatedData = data.map(item => ({
        ...item,
        translatedCrop: t(`crops.${item.crop}`, item.crop)
    }));
    
    return (
        <Card className="shadow-[var(--shadow-card)] border-border/50">
            <CardHeader>
                <CardTitle>{t("analytics.cropDistribution.title")}</CardTitle>
                <CardDescription>{t("analytics.cropDistribution.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={translatedData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                        <XAxis 
                            dataKey="translatedCrop" 
                            className="text-xs"
                            tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                        />
                        <YAxis className="text-xs"/>
                        <Tooltip
                            formatter={(value: number, name: string, props: any) => {
                                const translatedCrop = t(`crops.${props.payload.crop}`, { defaultValue: props.payload.crop });
                                return [`${value}`, translatedCrop];
                            }}
                            contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend/>
                        <Bar 
                            dataKey="count" 
                            fill="hsl(var(--primary))"
                            name={t("analytics.cropDistribution.submissions")} 
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
