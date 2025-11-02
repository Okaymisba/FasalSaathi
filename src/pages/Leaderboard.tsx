import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ArrowLeft, Award, Medal, Trophy} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import {Navbar} from "@/components/Navbar";
import {Button} from "@/components/ui/button";

interface LeaderboardEntry {
    farmer_id: string;
    farmer_name: string;
    province: string;
    avg_yield_per_acre: number;
    avg_wastage: number;
    score: number;
    rank: number;
}

export default function Leaderboard() {
    const navigate = useNavigate();
    const {user} = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState<number | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);

            // Fetch all farmer data with profile info
            const {data: farmerData, error} = await supabase
                .from("farmer_data")
                .select(`
          farmer_id,
          area,
          yield,
          wastage,
          profiles!inner (
            name,
            province
          )
        `);

            if (error) throw error;

            // Aggregate data by farmer
            const farmerMap = new Map<string, {
                name: string;
                province: string;
                totalYield: number;
                totalArea: number;
                totalWastage: number;
                count: number;
            }>();

            farmerData.forEach((entry: any) => {
                const farmerId = entry.farmer_id;
                if (!farmerMap.has(farmerId)) {
                    farmerMap.set(farmerId, {
                        name: entry.profiles.name,
                        province: entry.profiles.province,
                        totalYield: 0,
                        totalArea: 0,
                        totalWastage: 0,
                        count: 0,
                    });
                }

                const farmer = farmerMap.get(farmerId)!;
                farmer.totalYield += entry.yield;
                farmer.totalArea += entry.area;
                farmer.totalWastage += entry.wastage;
                farmer.count += 1;
            });

            // Calculate scores and create leaderboard entries
            const entries: LeaderboardEntry[] = [];
            farmerMap.forEach((data, farmerId) => {
                const avgYieldPerAcre = data.totalYield / data.totalArea;
                const avgWastage = data.totalWastage / data.count;
                const score = avgYieldPerAcre * (1 - avgWastage / 100);

                entries.push({
                    farmer_id: farmerId,
                    farmer_name: data.name,
                    province: data.province,
                    avg_yield_per_acre: avgYieldPerAcre,
                    avg_wastage: avgWastage,
                    score: score,
                    rank: 0,
                });
            });

            // Sort by score descending and assign ranks
            entries.sort((a, b) => b.score - a.score);
            entries.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            setLeaderboard(entries);

            // Find current user's rank
            if (user) {
                const userEntry = entries.find((e) => e.farmer_id === user.id);
                if (userEntry) {
                    setUserRank(userEntry.rank);
                }
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500"/>;
        if (rank === 2) return <Medal className="h-6 w-6 text-gray-400"/>;
        if (rank === 3) return <Award className="h-6 w-6 text-amber-600"/>;
        return null;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return "bg-yellow-50 dark:bg-yellow-950/20";
        if (rank === 2) return "bg-gray-50 dark:bg-gray-950/20";
        if (rank === 3) return "bg-amber-50 dark:bg-amber-950/20";
        return "";
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-12 w-64"/>
                <Skeleton className="h-96 w-full"/>
            </div>
        );
    }

    return (
        <>
            <Navbar/>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-4 w-4"/>
                                <span className="sr-only">Back</span>
                            </Button>
                            <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
                        </div>
                        <p className="text-muted-foreground ml-12">
                            Top performing farmers ranked by yield efficiency
                        </p>
                    </div>
                    {userRank && (
                        <Card className="bg-primary/10">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Your Rank</p>
                                <p className="text-2xl font-bold text-primary">#{userRank}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Rankings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Rank</TableHead>
                                        <TableHead>Farmer Name</TableHead>
                                        <TableHead>Province</TableHead>
                                        <TableHead className="text-right">Avg Yield/Acre (Tons)</TableHead>
                                        <TableHead className="text-right">Avg Wastage (%)</TableHead>
                                        <TableHead className="text-right">Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaderboard.map((entry) => (
                                        <TableRow
                                            key={entry.farmer_id}
                                            className={`${getRankColor(entry.rank)} ${
                                                user?.id === entry.farmer_id ? "border-l-4 border-primary" : ""
                                            }`}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {getRankIcon(entry.rank)}
                                                    <span>#{entry.rank}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{entry.farmer_name}</TableCell>
                                            <TableCell>{entry.province}</TableCell>
                                            <TableCell className="text-right">
                                                {entry.avg_yield_per_acre.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {entry.avg_wastage.toFixed(2)}%
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {entry.score.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary"/>
                            Rewards & Recognition
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🥇</span>
                            <p className="text-sm">
                                <strong>Top 3 farmers this month</strong> will receive fertilizer vouchers
                                and premium seeds!
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🥈</span>
                            <p className="text-sm">
                                <strong>Top 10 farmers</strong> get exclusive badges on their profile and
                                featured recognition.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🎯</span>
                            <p className="text-sm">
                                <strong>All participants</strong> contribute to regional agricultural
                                insights and help improve farming practices across Pakistan.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
