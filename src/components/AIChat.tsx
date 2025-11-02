import {useEffect, useRef, useState} from 'react';
import {Bot, Send} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useTranslation} from 'react-i18next';
import {useAuth} from "@/hooks/useAuth";
import {toast} from "@/components/ui/use-toast";

type Message = {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
};

export const AIChat = () => {
    const {t, i18n} = useTranslation();
    const {user} = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user?.id) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: input,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('https://cjmkbixlyiukpdvkxyja.supabase.co/functions/v1/farmer_chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbWtiaXhseWl1a3Bkdmt4eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDIyMjUsImV4cCI6MjA3NzU3ODIyNX0.3vyckq55hbV93YV2KJfUW-b6C1UIPfCtKzIzlqA_xh8`
                },
                body: JSON.stringify({
                    farmer_id: user.id,
                    question: input,
                    language: i18n.language
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(t('chat.error') + ` (${response.status}): ${errorText}`);
            }

            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Received non-JSON response from server');
            }

            const data = await response.json().catch(error => {
                console.error('JSON parse error:', error);
                throw new Error('Failed to parse server response');
            });

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.answer || t('chat.noResponse'),
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            toast({
                title: t('error'),
                description: t('chat.error'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col h-[600px] bg-card rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary"/>
                        <h3 className="font-semibold">{t('chat.assistant')}</h3>
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p>{t('chat.welcome')}</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${message.isUser
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-muted rounded-bl-none'}`}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                    </p>
                                </div>
                            </div>)))}
                </div>
                <div ref={messagesEndRef}/>
                {isLoading && (
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce"
                             style={{animationDelay: '0ms'}}/>
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce"
                             style={{animationDelay: '150ms'}}/>
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce"
                             style={{animationDelay: '300ms'}}/>
                    </div>
                )}
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('chat.placeholder')}
                        className="flex-1"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}/>
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4"/>
                    </Button>
                </div>
            </form>
        </>
    );
};
