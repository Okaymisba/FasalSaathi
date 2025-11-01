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
    return (
        <Card className="shadow-[var(--shadow-card)] border-border/50">
            <CardHeader>
                <CardTitle>{t("analytics.cropDistribution.title")}</CardTitle>
                <CardDescription>{t("analytics.cropDistribution.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                        <XAxis dataKey="crop" className="text-xs"/>
                        <YAxis className="text-xs"/>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend/>
                        <Bar dataKey="count" fill="hsl(var(--primary))"
                             name={t("analytics.cropDistribution.submissions")} radius={[8, 8, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
