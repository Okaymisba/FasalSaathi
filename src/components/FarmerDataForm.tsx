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
import {Loader2, Sprout, UploadCloud, X} from "lucide-react";
import {useTranslation} from "react-i18next";

type FormData = {
    crop: string;
    area: string;
    harvested_amount: string;
    wastage: string;
    reason: string;
    images: FileList | null;
    attestation: boolean;
};

// Crop keys that match the translation keys
const cropKeys = [
    'wheat', 'rice', 'maize', 'barley', 'sorghum', 'millet', 'oats',
    'cotton', 'sugarcane', 'tobacco', 'jute', 'kenaf',
    'chickpea', 'lentil', 'mungBean', 'blackGram', 'peas', 'cowpea', 'pigeonPea',
    'rapeseedMustard', 'mustard', 'canola', 'sunflower', 'sesame', 'groundnut', 'soybean', 'safflower', 'castor',
    'berseem', 'lucerne', 'sorghumSudanGrass', 'guineaGrass', 'maizeFodder',
    'potato', 'onion', 'tomato', 'chili', 'okra', 'cauliflower', 'cabbage', 'brinjal', 'garlic', 'ginger',
    'spinach', 'coriander', 'cucumber', 'carrot', 'radish', 'turnip', 'pumpkin', 'bitterGourd', 'bottleGourd',
    'tinda', 'peasVegetable', 'mango', 'citrus', 'banana', 'dates', 'guava', 'apple', 'apricot', 'peach',
    'plum', 'pear', 'pomegranate', 'grapes', 'watermelon', 'muskmelon', 'strawberry', 'turmeric', 'cumin',
    'fennel', 'fenugreek', 'blackPepper', 'cardamom', 'nigella', 'quinoa', 'buckwheat', 'flax', 'teff'
] as const;

type CropKey = typeof cropKeys[number];

// Wastage reason keys that match the translation keys
const wastageReasonKeys = ['weather', 'pestAttack', 'transport', 'overproduction', 'other'] as const;
type WastageReasonKey = typeof wastageReasonKeys[number];

// Helper functions to get translated values
const getTranslatedCrops = (t: any) => {
    return cropKeys.map(key => ({
        key,
        label: t(`crops.${key}`)
    }));
};

const getTranslatedWastageReasons = (t: any) => {
    return wastageReasonKeys.map(key => ({
        key,
        label: t(`wastageReasons.${key}`)
    }));
};

interface FarmerDataFormProps {
    onSuccess: () => void;
}

export function FarmerDataForm({onSuccess}: FarmerDataFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [isForward, setIsForward] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Convert FileList to array and add new files
        const newFiles = Array.from(files);
        const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 5); // Limit to 5 files

        // Update state
        setSelectedFiles(updatedFiles);

        // Create a new DataTransfer object to update the file input
        const dataTransfer = new DataTransfer();
        updatedFiles.forEach(file => dataTransfer.items.add(file));
        const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
        if (fileInput) {
            fileInput.files = dataTransfer.files;
        }

        // Update form value
        setValue("images", dataTransfer.files as any, {shouldValidate: true});

        // Update preview URLs and revoke old URLs to prevent memory leaks
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        const urls = updatedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
    };

    const handleRemoveImage = (index: number) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);

        // Update the file input
        const dataTransfer = new DataTransfer();
        newFiles.forEach(file => dataTransfer.items.add(file));
        const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
        if (fileInput) {
            fileInput.files = dataTransfer.files;
        }

        // Update form value
        setValue("images", dataTransfer.files as any, {shouldValidate: true});

        // Update preview URLs and revoke old URLs to prevent memory leaks
        const urls = [...previewUrls];
        URL.revokeObjectURL(urls[index]);
        urls.splice(index, 1);
        setPreviewUrls(urls);
    };
    const {profile, user} = useAuth();
    const {t} = useTranslation("dashboard");

    // Get translated crops and wastage reasons
    const translatedCrops = getTranslatedCrops(t);
    const translatedWastageReasons = getTranslatedWastageReasons(t);

    // Sort crops alphabetically by translated label
    const sortedCrops = [...translatedCrops].sort((a, b) => a.label.localeCompare(b.label));

    // Build validation schema with translated messages
    const formSchema = z.object({
        crop: z.string().min(1, t("form.validation.cropRequired")),
        area: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: t("form.validation.areaPositive"),
        }),
        harvested_amount: z
            .string()
            .min(1, t("form.validation.harvestedRequired"))
            .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
                message: t("form.validation.harvestedNonNegative"),
            }),
        wastage: z
            .string()
            .min(1, t("form.validation.wastageRequired"))
            .refine(
                (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
                {message: t("form.validation.wastageRange")}
            ),
        reason: z.string().min(1, t("form.validation.reasonRequired")),
        images: z.any()
            .refine(files => files && files.length > 0, {
                message: t("form.validation.atLeastOneImage")
            })
            .refine(files => files && files.length <= 5, {
                message: t("form.validation.maxImages")
            })
            .refine(
                files => {
                    if (!files || files.length === 0) return false;
                    const fileArray = Array.isArray(files) ? files : Array.from(files);
                    return fileArray.every(file => {
                        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                        return file && file.type && validTypes.includes(file.type);
                    });
                },
                {message: t("form.validation.invalidImageType")}
            ),
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
            key: "images",
            title: t("form.steps.images.title"),
            description: t("form.steps.images.description"),
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

    const uploadImages = async (): Promise<string[]> => {
        if (selectedFiles.length === 0) return [];
        if (!user) {
            throw new Error("User not authenticated");
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const paths: string[] = [];
            const totalFiles = selectedFiles.length;

            for (let i = 0; i < totalFiles; i++) {
                const file = selectedFiles[i];

                // Check file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
                }

                // Generate a unique filename with user ID as the first folder
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

                // Upload the file
                const {error: uploadError} = await supabase.storage
                    .from('produced_crop_images')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: file.type
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                }

                // Get the public URL
                const {data: {publicUrl}} = supabase.storage
                    .from('produced_crop_images')
                    .getPublicUrl(fileName);

                paths.push(publicUrl);
                setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
            }

            return paths;
        } catch (error) {
            console.error('Error in uploadImages:', error);
            throw error;
        } finally {
            setIsUploading(false);
        }
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
            let imagePaths: string[] = [];

            // Upload images if any
            if (selectedFiles.length > 0) {
                try {
                    imagePaths = await uploadImages();
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    toast.error(t("form.toasts.uploadError.title"), {
                        description: uploadError instanceof Error ? uploadError.message : t("form.toasts.uploadError.desc"),
                    });
                    return;
                }
            }

            const {error} = await supabase.from("farmer_data").insert({
                farmer_id: user.id,
                province: profile.province,
                district: profile.district,
                crop: data.crop,
                area: Number(data.area),
                yield: Number(data.harvested_amount),
                wastage: Number(data.wastage),
                reason: data.reason,
                image_paths: imagePaths.length > 0 ? imagePaths : null,
            } as any);

            if (error) {
                console.error('Database error:', error);
                throw error;
            }

            toast.success(t("form.toasts.submitSuccess.title"), {
                description: t("form.toasts.submitSuccess.desc"),
            });

            // Reset form and previews
            setPreviewUrls([]);
            setSelectedFiles([]); // Clear selected files
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
                                {profile.district}, {profile.province}
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
                                                    value={watch("crop")}
                                                    onValueChange={(value) => {
                                                        setValue("crop", value, {shouldValidate: true});
                                                    }}
                                                >
                                                    <SelectTrigger id="crop">
                                                        <SelectValue placeholder={t("form.placeholders.selectCrop")}/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {sortedCrops.map(({key, label}) => (
                                                            <SelectItem key={key} value={key}>
                                                                {label}
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
                                                    value={watch("reason")}
                                                    onValueChange={(value) => {
                                                        setValue("reason", value, {shouldValidate: true});
                                                    }}
                                                >
                                                    <SelectTrigger id="reason">
                                                        <SelectValue placeholder={t("form.placeholders.selectReason")}/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {translatedWastageReasons.map(({key, label}) => (
                                                            <SelectItem key={key} value={key}>
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.reason && (
                                                    <p className="text-sm text-destructive">{errors.reason.message}</p>
                                                )}
                                            </div>
                                        )}

                                        {steps[currentStep].key === "images" && (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="images">{t("form.labels.uploadImages")}</Label>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        {t("form.steps.images.description")}
                                                    </p>
                                                    <div className="flex items-center justify-center w-full">
                                                        <label
                                                            htmlFor="dropzone-file"
                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors"
                                                        >
                                                            <div
                                                                className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                                                <UploadCloud
                                                                    className="w-8 h-8 mb-2 text-muted-foreground"/>
                                                                <p className="text-sm text-muted-foreground">
                                                                    <span className="font-medium text-primary">
                                                                        {t("form.upload.clickToUpload")}
                                                                    </span>{' '}
                                                                    {t("form.upload.orDragDrop")}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {t("form.upload.fileTypes")}
                                                                </p>
                                                            </div>
                                                            <input
                                                                id="dropzone-file"
                                                                type="file"
                                                                multiple
                                                                accept="image/png, image/jpeg, image/webp"
                                                                className="hidden"
                                                                onChange={handleFileChange}
                                                                onClick={(e) => {
                                                                    // Reset the value to allow selecting the same file again
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                    {errors.images && (
                                                        <p className="text-sm text-destructive mt-2">{errors.images.message as string}</p>
                                                    )}

                                                    {isUploading && (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span>{t("form.upload.uploading")} {uploadProgress}%</span>
                                                                <span>{Math.round((uploadProgress / 100) * (watch("images")?.length || 0))} {t("form.upload.of")} {(watch("images")?.length || 0)}</span>
                                                            </div>
                                                            <div
                                                                className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all duration-300"
                                                                    style={{width: `${uploadProgress}%`}}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {previewUrls.length > 0 && (
                                                        <div className="mt-4">
                                                            <h4 className="text-sm font-medium mb-2">Preview
                                                                ({previewUrls.length})</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {previewUrls.map((url, index) => (
                                                                    <div key={index} className="relative group">
                                                                        <div
                                                                            className="w-20 h-20 rounded-md overflow-hidden border border-muted">
                                                                            <img
                                                                                src={url}
                                                                                alt={`Preview ${index + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newPreviewUrls = [...previewUrls];
                                                                                newPreviewUrls.splice(index, 1);
                                                                                setPreviewUrls(newPreviewUrls);

                                                                                handleRemoveImage(index);
                                                                            }}
                                                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X className="h-3 w-3"/>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
