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
    const [currentStep, setCurrentStep] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [isForward, setIsForward] = useState(true);
    const {profile, user} = useAuth();

    const {
        register,
        handleSubmit,
        formState: {errors},
        setValue,
        watch,
        reset,
        trigger,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            attestation: false,
        },
    });

    const steps: Array<{
        key: keyof FormData;
        title: string;
        description: string;
    }> = [
        {
            key: "crop",
            title: "Crop Type",
            description:
                "Select the crop you grew this season. This helps us compare production across your district.",
        },
        {
            key: "area",
            title: "Area Cultivated (acres)",
            description:
                "Enter total land used for this crop in acres. Use decimals if needed, e.g., 10.5.",
        },
        {
            key: "harvested_amount",
            title: "Harvested Amount (tons)",
            description:
                "Total quantity harvested in metric tons. If not harvested yet, enter 0.",
        },
        {
            key: "wastage",
            title: "Wastage (%)",
            description:
                "Approximate percentage of the harvest lost or wasted (0 to 100).",
        },
        {
            key: "reason",
            title: "Reason for Wastage",
            description:
                "Choose the main reason for wastage. This helps identify support needs.",
        },
        {
            key: "attestation",
            title: "Confirm Accuracy",
            description:
                "Please confirm the information you provided is correct to the best of your knowledge.",
        },
    ];

    const totalSteps = steps.length;

    const goNext = async () => {
        const field = steps[currentStep].key;
        const isValid = await trigger(field as any, {shouldFocus: true});
        if (!isValid) return;
        setIsForward(true);
        setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
    };

    const goBack = () => {
        if (currentStep === 0) {
            setShowIntro(true);
            return;
        }
        setIsForward(false);
        setCurrentStep((s) => Math.max(s - 1, 0));
    };

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
                    {/* Intro Screen */}
                    {showIntro ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="rounded-lg border p-4 bg-muted/20">
                                <h3 className="font-semibold mb-1">Getting started</h3>
                                <p className="text-sm text-muted-foreground">
                                    This simple form will guide you step-by-step. You will fill one detail at a time.
                                    It takes about a minute.
                                </p>
                                <ul className="list-disc pl-5 mt-3 text-sm text-muted-foreground space-y-1">
                                    <li>Crop you grew</li>
                                    <li>Area of land (in acres)</li>
                                    <li>Harvested amount (in tons)</li>
                                    <li>Wastage percentage</li>
                                    <li>Main reason for wastage</li>
                                    <li>Confirmation that details are correct</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-3">
                                    You can move back and forward anytime. Your district will be filled automatically.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                    onClick={() => setShowIntro(false)}
                                >
                                    Start
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                            {/* Progress Indicator */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Step {currentStep + 1} of {totalSteps}
                                    </span>
                                    <span>{steps[currentStep].title}</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary transition-all"
                                        style={{width: `${((currentStep + 1) / totalSteps) * 100}%`}}
                                    />
                                </div>
                            </div>

                            {/* Active Step Field */}
                            <div
                                key={steps[currentStep].key as string}
                                className={
                                    `space-y-2 animate-in fade-in ` +
                                    (isForward ? "slide-in-from-right-2" : "slide-in-from-left-2")
                                }
                            >
                                <div className="animate-container">
                                    <div className="animate-item">
                                        {steps[currentStep].key === "crop" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="crop">Crop Type *</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <Select
                                                    onValueChange={(value) => setValue("crop", value, {shouldValidate: true})}
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
                                        )}

                                        {steps[currentStep].key === "area" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="area">Area Cultivated (acres) *</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
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
                                        )}

                                        {steps[currentStep].key === "harvested_amount" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="harvested_amount">Harvested Amount (tons) *</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
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
                                        )}

                                        {steps[currentStep].key === "wastage" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="wastage">Wastage (%) *</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
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
                                        )}

                                        {steps[currentStep].key === "reason" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="reason">Reason for Wastage *</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <Select
                                                    onValueChange={(value) => setValue("reason", value, {shouldValidate: true})}
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
                                        )}

                                        {steps[currentStep].key === "attestation" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="attestation">Confirm Accuracy *</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <div
                                                    className="flex items-start gap-3 p-4 rounded-lg border border-muted bg-muted/20">
                                                    <Checkbox
                                                        id="attestation"
                                                        checked={!!watch("attestation")}
                                                        onCheckedChange={(val) => setValue("attestation", !!val, {shouldValidate: true})}
                                                    />
                                                    <span className="text-sm leading-6">
                                        I confirm the data provided is accurate to the best of my knowledge and may be subject to verification.
                                    </span>
                                                </div>
                                                {errors.attestation && (
                                                    <p className="text-sm text-destructive">{errors.attestation.message}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-1/2"
                                            onClick={goBack}
                                            disabled={showIntro || isSubmitting}
                                        >
                                            Back
                                        </Button>

                                        {currentStep < totalSteps - 1 ? (
                                            <Button
                                                type="button"
                                                className="w-1/2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                                onClick={goNext}
                                                disabled={isSubmitting || showIntro}
                                            >
                                                Next
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                className="w-1/2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                                disabled={isSubmitting || !watch("attestation") || showIntro}
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
