import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/hooks/useAuth";
import {toast} from "sonner";
import {Loader2, Sprout} from "lucide-react";

const formSchema = z.object({
    crop: z.string().min(1, "Please select a crop type"),
    area: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Area must be greater than 0",
    }),
    harvested_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Harvested amount must be 0 or greater",
    }),
    wastage: z.string().refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
        {
            message: "Wastage must be between 0 and 100",
        }
    ),
    reason: z.string().min(1, "Please select a reason"),
    attestation: z.boolean().refine((val) => val === true, {
        message: "You must confirm the data is accurate",
    }),
});

type FormData = z.infer<typeof formSchema>;

const crops = [
    // Cereals & staples
    "Wheat",
    "Rice",
    "Maize",
    "Barley",
    "Sorghum",
    "Millet (Bajra)",
    "Oats",

    // Cash & industrial crops
    "Cotton",
    "Sugarcane",
    "Tobacco",
    "Jute",
    "Kenaf",

    // Pulses/legumes
    "Chickpea (Gram)",
    "Lentil (Masoor)",
    "Mung Bean",
    "Urd/Black Gram",
    "Peas",
    "Cowpea",
    "Pigeon Pea (Arhar)",

    // Oilseeds
    "Rapeseed-Mustard (Canola)",
    "Mustard",
    "Canola",
    "Sunflower",
    "Sesame (Till)",
    "Groundnut (Peanut)",
    "Soybean",
    "Safflower",
    "Castor",

    // Fodder & forage
    "Berseem",
    "Lucerne (Alfalfa)",
    "Sorghum-Sudan Grass",
    "Guinea Grass",
    "Maize (Fodder)",

    // Vegetables
    "Potato",
    "Onion",
    "Tomato",
    "Chili (Red/Green)",
    "Okra (Bhindi)",
    "Cauliflower",
    "Cabbage",
    "Brinjal (Eggplant)",
    "Garlic",
    "Ginger",
    "Spinach",
    "Coriander (Dhania)",
    "Cucumber",
    "Carrot",
    "Radish",
    "Turnip",
    "Pumpkin",
    "Bitter Gourd",
    "Bottle Gourd",
    "Tinda",
    "Peas (Vegetable)",

    // Fruits
    "Mango",
    "Citrus (Kinnow/Orange/Lemon)",
    "Banana",
    "Dates",
    "Guava",
    "Apple",
    "Apricot",
    "Peach",
    "Plum",
    "Pear",
    "Pomegranate",
    "Grapes",
    "Watermelon",
    "Muskmelon/Cantaloupe",
    "Strawberry",

    // Spices & condiments
    "Turmeric",
    "Cumin",
    "Fennel",
    "Fenugreek",
    "Black Pepper",
    "Cardamom",
    "Nigella (Kalonji)",

    // Other niche/regionals
    "Quinoa",
    "Buckwheat",
    "Flax (Linseed)",
    "Teff",
];
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

export function FarmerDataForm({onSuccess}: FarmerDataFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {profile, user} = useAuth();

    const {
        register,
        handleSubmit,
        formState: {errors},
        setValue,
        watch,
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            attestation: false,
        },
    });

    const onSubmit = async (data: FormData) => {
        if (!profile || !user) {
            toast.error("Authentication required", {
                description: "Please log in to submit data.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const {error} = await supabase.from("farmer_data").insert({
                farmer_id: user.id,
                province: profile.province,
                district: profile.district,
                crop: data.crop,
                area: Number(data.area),
                yield: Number(data.harvested_amount),
                wastage: Number(data.wastage),
                reason: data.reason,
            } as any);

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
                        <Sprout className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Submit Crop Data</CardTitle>
                        <CardDescription>Enter your farming details for regional insights</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {profile && (
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm font-medium mb-1">Submitting for:</p>
                            <p className="text-xs text-muted-foreground">
                                {profile.province} • {profile.district}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="crop">Crop Type *</Label>
                            <Select
                                onValueChange={(value) => setValue("crop", value)}
                                value={watch("crop")}
                            >
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select crop type"/>
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
                            <Label htmlFor="harvested_amount">Harvested Amount (tons) *</Label>
                            <Input
                                id="harvested_amount"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 25.0"
                                {...register("harvested_amount")}
                            />
                            {errors.harvested_amount && (
                                <p className="text-sm text-destructive">{errors.harvested_amount.message}</p>
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
                                    <SelectValue placeholder="Select reason"/>
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

                    <div className="space-y-2">
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-muted bg-muted/20">
                            <Checkbox
                                id="attestation"
                                checked={!!watch("attestation")}
                                onCheckedChange={(val) => setValue("attestation", !!val, {shouldValidate: true})}
                            />
                            <Label htmlFor="attestation" className="text-sm leading-6 font-normal">
                                I confirm the data provided is accurate to the best of my knowledge and may be subject
                                to verification.
                            </Label>
                        </div>
                        {errors.attestation && (
                            <p className="text-sm text-destructive">{errors.attestation.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                        disabled={isSubmitting || !watch("attestation")}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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
