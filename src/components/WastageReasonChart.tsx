import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useTranslation} from "react-i18next";

interface WastageData {
    reason: string;
    count: number;
}

interface WastageReasonChartProps {
    data: WastageData[];
}

const COLORS = [
    "hsl(123, 43%, 30%)",
    "hsl(85, 45%, 55%)",
    "hsl(30, 45%, 55%)",
    "hsl(45, 60%, 60%)",
    "hsl(15, 55%, 55%)",
];

export function WastageReasonChart({data}: WastageReasonChartProps) {
    const {t} = useTranslation("dashboard");
    
    // Map the data to include translated reasons
    const translatedData = data.map(item => ({
        ...item,
        translatedReason: t(`wastageReasons.${item.reason}`, item.reason)
    }));
    
    return (
        <Card className="shadow-[var(--shadow-card)] border-border/50">
            <CardHeader>
                <CardTitle>{t("analytics.wastageReasons.title")}</CardTitle>
                <CardDescription>{t("analytics.wastageReasons.description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={translatedData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({translatedReason, percent}) =>
                                `${translatedReason}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="translatedReason"
                        >
                            {translatedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend/>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
