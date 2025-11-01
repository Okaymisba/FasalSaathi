import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export function WastageReasonChart({ data }: WastageReasonChartProps) {
  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle>Wastage Reasons</CardTitle>
        <CardDescription>Distribution of crop wastage causes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ reason, percent }) =>
                `${reason}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
