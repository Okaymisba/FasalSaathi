import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sprout } from "lucide-react";

const formSchema = z.object({
  region: z.string().min(1, "Please select a region"),
  crop: z.string().min(1, "Please select a crop type"),
  area: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Area must be greater than 0",
  }),
  yield: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Yield must be 0 or greater",
  }),
  wastage: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    {
      message: "Wastage must be between 0 and 100",
    }
  ),
  reason: z.string().min(1, "Please select a reason"),
});

type FormData = z.infer<typeof formSchema>;

const regions = ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Mirpurkhas", "Other"];
const crops = ["Wheat", "Rice", "Cotton", "Sugarcane", "Mango", "Banana"];
const wastageReasons = [
  "Weather",
  "Pest Attack",
  "Transport",
  "Overproduction",
  "Other",
];

interface FarmerDataFormProps {
  onSuccess: () => void;
}

export function FarmerDataForm({ onSuccess }: FarmerDataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("farmer_data").insert({
        region: data.region,
        crop: data.crop,
        area: Number(data.area),
        yield: Number(data.yield),
        wastage: Number(data.wastage),
        reason: data.reason,
      });

      if (error) throw error;

      toast.success("Data submitted successfully!", {
        description: "Your crop data has been recorded.",
      });
      reset();
      onSuccess();
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Failed to submit data", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sprout className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Submit Crop Data</CardTitle>
            <CardDescription>Enter your farming details for regional insights</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select
                onValueChange={(value) => setValue("region", value)}
                value={watch("region")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crop">Crop Type *</Label>
              <Select
                onValueChange={(value) => setValue("crop", value)}
                value={watch("crop")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select crop type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {crops.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.crop && (
                <p className="text-sm text-destructive">{errors.crop.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area Cultivated (acres) *</Label>
              <Input
                id="area"
                type="number"
                step="0.01"
                placeholder="e.g., 10.5"
                {...register("area")}
              />
              {errors.area && (
                <p className="text-sm text-destructive">{errors.area.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="yield">Estimated Yield (tons) *</Label>
              <Input
                id="yield"
                type="number"
                step="0.01"
                placeholder="e.g., 25.0"
                {...register("yield")}
              />
              {errors.yield && (
                <p className="text-sm text-destructive">{errors.yield.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wastage">Wastage (%) *</Label>
              <Input
                id="wastage"
                type="number"
                step="0.1"
                placeholder="e.g., 5.0"
                {...register("wastage")}
              />
              {errors.wastage && (
                <p className="text-sm text-destructive">{errors.wastage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Wastage *</Label>
              <Select
                onValueChange={(value) => setValue("reason", value)}
                value={watch("reason")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {wastageReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Data"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
