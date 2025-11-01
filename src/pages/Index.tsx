import { useState } from "react";
import { FarmerDataForm } from "@/components/FarmerDataForm";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sprout, BarChart3 } from "lucide-react";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("submit");

  const handleFormSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    // Auto-switch to analytics after successful submission
    setTimeout(() => {
      setActiveTab("analytics");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sprout className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                AgriScope – Sindh Insights
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time agricultural analytics for Sindh farmers
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Sprout className="h-4 w-4" />
              Submit Data
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="mt-0">
            <div className="max-w-3xl mx-auto">
              <FarmerDataForm onSuccess={handleFormSuccess} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <AnalyticsDashboard refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 AgriScope. Empowering Sindh's farming community with data-driven insights.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
