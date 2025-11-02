import {useState} from 'react';
import {Bot, Send} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

type Message = {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
};

export const AIChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

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

        // TODO: Replace with actual API call
        setTimeout(() => {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: 'This is a placeholder response. The AI chat functionality will be implemented in the next phase.',
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[600px] bg-card rounded-lg border shadow-sm">
            <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary"/>
                    <h3 className="font-semibold">AI Assistant</h3>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <p>Ask me anything about agriculture in Sindh!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    message.isUser
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-muted rounded-bl-none'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                </p>
                            </div>
                        </div>
                    ))
                )}
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
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4"/>
                    </Button>
                </div>
            </form>
        </div>
    );
};
