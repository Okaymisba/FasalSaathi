import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {useTranslation} from "react-i18next";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {toast} from "sonner";
import {Loader2, Sprout} from "lucide-react";
import {Navbar} from "@/components/Navbar";

const provinces = ["Punjab", "Sindh", "KPK", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "ICT"];

const LoginSchema = (t: any) => z.object({
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(6, t('validation.minLength', {count: 6})),
});

const SignupSchema = (t: any) => z.object({
    name: z.string().min(2, t('validation.minLength', {count: 2})),
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(6, t('validation.minLength', {count: 6})),
    phone: z.string().optional(),
    province: z.string().min(1, t('validation.required')),
    district: z.string().min(2, t('validation.minLength', {count: 2})),
});

type LoginData = z.infer<ReturnType<typeof LoginSchema>>;
type SignupData = z.infer<ReturnType<typeof SignupSchema>>;

export default function Auth() {
    const {t} = useTranslation('auth');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const loginForm = useForm<LoginData>({
        resolver: zodResolver(LoginSchema(t)),
    });

    const signupForm = useForm<SignupData>({
        resolver: zodResolver(SignupSchema(t)),
    });

    const handleLogin = async (data: LoginData) => {
        setIsLoading(true);
        try {
            const {error} = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) throw error;

            toast.success(t('welcomeBack'));
            navigate("/app");
        } catch (error: any) {
            toast.error(t('errors.loginFailed'), {
                description: error.message || t('errors.checkCredentials'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (data: SignupData) => {
        setIsLoading(true);
        try {
            const {error} = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/app`,
                    data: {
                        name: data.name,
                        phone: data.phone,
                        province: data.province,
                        district: data.district,
                    },
                },
            });

            if (error) throw error;

            toast.success(t('errors.accountCreated'), {
                description: t('errors.checkEmail'),
            });
            signupForm.reset();
        } catch (error: any) {
            toast.error(t('errors.signupFailed'), {
                description: error.message || t('errors.tryAgain'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar/>
            <div
                className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
                    <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-accent/10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sprout className="h-8 w-8 text-primary"/>
                            <h1 className="text-2xl font-bold">{t('appName')}</h1>
                        </div>
                        <CardDescription>{t('appDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">{t('login.title')}</TabsTrigger>
                                <TabsTrigger value="signup">{t('signup.title')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">{t('login.email')}</Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder={t('login.email')}
                                            {...loginForm.register("email")}
                                        />
                                        {loginForm.formState.errors.email && (
                                            <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">{t('login.password')}</Label>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder={t('login.password')}
                                            {...loginForm.register("password")}
                                        />
                                        <div className="text-right text-sm">
                                            <button type="button" className="text-primary hover:underline">
                                                {t('login.forgotPassword')}
                                            </button>
                                        </div>
                                        {loginForm.formState.errors.password && (
                                            <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                {t('login.loggingIn')}
                                            </>
                                        ) : (
                                            t('login.submit')
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">{t('signup.name')} *</Label>
                                        <Input
                                            id="signup-name"
                                            placeholder={t('signup.name')}
                                            {...signupForm.register("name")}
                                        />
                                        {signupForm.formState.errors.name && (
                                            <p className="text-sm text-destructive">{signupForm.formState.errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">{t('signup.email')} *</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder={t('signup.email')}
                                            {...signupForm.register("email")}
                                        />
                                        {signupForm.formState.errors.email && (
                                            <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">{t('signup.password')} *</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            placeholder={t('signup.password')}
                                            {...signupForm.register("password")}
                                        />
                                        {signupForm.formState.errors.password && (
                                            <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-phone">{t('signup.phone')}</Label>
                                        <Input
                                            id="signup-phone"
                                            placeholder={t('signup.phone')}
                                            {...signupForm.register("phone")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-province">{t('signup.province')} *</Label>
                                        <Select
                                            onValueChange={(value) => signupForm.setValue("province", value)}
                                            value={signupForm.watch("province")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('signup.selectProvince')}/>
                                            </SelectTrigger>
                                            <SelectContent className="z-50">
                                                {provinces.map((province) => (
                                                    <SelectItem key={province} value={province}>
                                                        {province}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {signupForm.formState.errors.province && (
                                            <p className="text-sm text-destructive">{signupForm.formState.errors.province.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-district">{t('signup.district')} *</Label>
                                        <Input
                                            id="signup-district"
                                            placeholder={t('signup.district')}
                                            {...signupForm.register("district")}
                                        />
                                        {signupForm.formState.errors.district && (
                                            <p className="text-sm text-destructive">{signupForm.formState.errors.district.message}</p>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                {t('signup.creatingAccount')}
                                            </>
                                        ) : (
                                            t('signup.submit')
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
