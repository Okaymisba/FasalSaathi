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
import {useTranslation} from "react-i18next";

type FormData = {
    crop: string;
    area: string;
    harvested_amount: string;
    wastage: string;
    reason: string;
    attestation: boolean;
};

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
    const {t} = useTranslation("dashboard");

    // Build validation schema with translated messages
    const formSchema = z.object({
        crop: z.string().min(1, t("form.validation.cropRequired")),
        area: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: t("form.validation.areaPositive"),
        }),
        harvested_amount: z
            .string()
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
                message: t("form.validation.harvestedNonNegative"),
            }),
        wastage: z
            .string()
            .refine(
                (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
                {message: t("form.validation.wastageRange")}
            ),
        reason: z.string().min(1, t("form.validation.reasonRequired")),
        attestation: z.boolean().refine((val) => val === true, {
            message: t("form.validation.attestationConfirm"),
        }),
    });

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
            title: t("form.steps.crop.title"),
            description: t("form.steps.crop.description"),
        },
        {
            key: "area",
            title: t("form.steps.area.title"),
            description: t("form.steps.area.description"),
        },
        {
            key: "harvested_amount",
            title: t("form.steps.harvested_amount.title"),
            description: t("form.steps.harvested_amount.description"),
        },
        {
            key: "wastage",
            title: t("form.steps.wastage.title"),
            description: t("form.steps.wastage.description"),
        },
        {
            key: "reason",
            title: t("form.steps.reason.title"),
            description: t("form.steps.reason.description"),
        },
        {
            key: "attestation",
            title: t("form.steps.attestation.title"),
            description: t("form.steps.attestation.description"),
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
            toast.error(t("form.toasts.authRequired.title"), {
                description: t("form.toasts.authRequired.desc"),
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

            toast.success(t("form.toasts.submitSuccess.title"), {
                description: t("form.toasts.submitSuccess.desc"),
            });
            reset();
            onSuccess();
        } catch (error) {
            console.error("Error submitting data:", error);
            toast.error(t("form.toasts.submitError.title"), {
                description: t("form.toasts.submitError.desc"),
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
                        <CardTitle className="text-2xl">{t("form.submitTitle")}</CardTitle>
                        <CardDescription>{t("form.submitDescription")}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {profile && (
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 text-sm text-foreground/80">
                            <span className="font-medium">{t("form.submittingFor")}</span>
                            <span className="font-semibold text-primary flex items-center">
                                <span className="inline-block w-1 h-1 rounded-full bg-primary/60 mr-1.5"></span>
                                {profile.province} • {profile.district}
                            </span>
                        </div>
                    )}
                    {/* Intro Screen */}
                    {showIntro ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="rounded-lg border p-4 bg-muted/20">
                                <h3 className="font-semibold mb-1">{t("form.intro.title")}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t("form.intro.body")}
                                </p>
                                <ul className="list-disc pl-5 mt-3 text-sm text-muted-foreground space-y-1">
                                    <li>{t("form.intro.items.crop")}</li>
                                    <li>{t("form.intro.items.area")}</li>
                                    <li>{t("form.intro.items.harvested")}</li>
                                    <li>{t("form.intro.items.wastage")}</li>
                                    <li>{t("form.intro.items.reason")}</li>
                                    <li>{t("form.intro.items.confirm")}</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-3">
                                    {t("form.intro.note")}
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                    onClick={() => setShowIntro(false)}
                                >
                                    {t("form.intro.start")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                            {/* Progress Indicator */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        {t("form.progress.stepOf", {current: currentStep + 1, total: totalSteps})}
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
                                    <div className="animate-item mb-6 md:mb-8">
                                        {steps[currentStep].key === "crop" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="crop">{t("form.labels.crop")}</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <Select
                                                    onValueChange={(value) => setValue("crop", value, {shouldValidate: true})}
                                                    value={watch("crop")}
                                                >
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder={t("form.placeholders.crop")}/>
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
                                                <Label htmlFor="area">{t("form.labels.area")}</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <Input
                                                    id="area"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={t("form.placeholders.area")}
                                                    {...register("area")}
                                                />
                                                {errors.area && (
                                                    <p className="text-sm text-destructive">{errors.area.message}</p>
                                                )}
                                            </div>
                                        )}

                                        {steps[currentStep].key === "harvested_amount" && (
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="harvested_amount">{t("form.labels.harvested_amount")}</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <Input
                                                    id="harvested_amount"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={t("form.placeholders.harvested_amount")}
                                                    {...register("harvested_amount")}
                                                />
                                                {errors.harvested_amount && (
                                                    <p className="text-sm text-destructive">{errors.harvested_amount.message}</p>
                                                )}
                                            </div>
                                        )}

                                        {steps[currentStep].key === "wastage" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="wastage">{t("form.labels.wastage")}</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <Input
                                                    id="wastage"
                                                    type="number"
                                                    step="0.1"
                                                    placeholder={t("form.placeholders.wastage")}
                                                    {...register("wastage")}
                                                />
                                                {errors.wastage && (
                                                    <p className="text-sm text-destructive">{errors.wastage.message}</p>
                                                )}
                                            </div>
                                        )}

                                        {steps[currentStep].key === "reason" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="reason">{t("form.labels.reason")}</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <Select
                                                    onValueChange={(value) => setValue("reason", value, {shouldValidate: true})}
                                                    value={watch("reason")}
                                                >
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder={t("form.placeholders.reason")}/>
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover z-50">
                                                        {wastageReasons.map((reason) => {
                                                            const key =
                                                                reason === "Weather" ? "weather" :
                                                                    reason === "Pest Attack" ? "pest" :
                                                                        reason === "Transport" ? "transport" :
                                                                            reason === "Overproduction" ? "overproduction" :
                                                                                "other";
                                                            return (
                                                                <SelectItem key={reason} value={reason}>
                                                                    {t(`form.reasons.${key}`)}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                                {errors.reason && (
                                                    <p className="text-sm text-destructive">{errors.reason.message}</p>
                                                )}
                                            </div>
                                        )}

                                        {steps[currentStep].key === "attestation" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="attestation">{t("form.labels.attestation")}</Label>
                                                <p className="text-xs text-muted-foreground">{steps[currentStep].description}</p>
                                                <div
                                                    className="flex items-start gap-3 p-4 rounded-lg border border-muted bg-muted/20">
                                                    <Checkbox
                                                        id="attestation"
                                                        checked={!!watch("attestation")}
                                                        onCheckedChange={(val) => setValue("attestation", !!val, {shouldValidate: true})}
                                                    />
                                                    <span className="text-sm leading-6">
                                        {t("form.attestation.text")}
                                    </span>
                                                </div>
                                                {errors.attestation && (
                                                    <p className="text-sm text-destructive">{errors.attestation.message}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex gap-3 mt-4 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-1/2"
                                            onClick={goBack}
                                            disabled={showIntro || isSubmitting}
                                        >
                                            {t("form.buttons.back")}
                                        </Button>

                                        {currentStep < totalSteps - 1 ? (
                                            <Button
                                                type="button"
                                                className="w-1/2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                                onClick={goNext}
                                                disabled={isSubmitting || showIntro}
                                            >
                                                {t("form.buttons.next")}
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
                                                        {t("form.buttons.submitting")}
                                                    </>
                                                ) : (
                                                    t("form.buttons.submit")
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
