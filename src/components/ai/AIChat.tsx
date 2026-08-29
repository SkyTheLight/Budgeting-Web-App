"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UserFinancialContext {
  incomeThisMonth: number;
  expensesThisMonth: number;
  balance: number;
  savingsRate: number;
  topCategories: { category: string; amount: number }[];
  budgetsOver: string[];
  savingsGoals: { name: string; progress: number }[];
}

export type { UserFinancialContext };

const financialKnowledge: Record<string, { keywords: string[]; response: string }> = {
  budget: {
    keywords: ["budget", "budgeting", "plan", "planning", "allocate"],
    response: "To create a good budget, try the 50/30/20 rule: 50% for needs (rent, utilities, groceries), 30% for wants (entertainment, dining out), and 20% for savings and debt repayment. Start by tracking all expenses for a month to understand your spending habits.\n\n💡 Pro tip: Use zero-based budgeting where every peso has a job!"
  },
  savings: {
    keywords: ["save", "saving", "save money", "accumulate", "put aside", "stash"],
    response: "Effective savings strategies:\n1) Pay yourself first - automate transfers to savings\n2) Set specific, measurable goals with deadlines\n3) Use the 24-hour rule for impulse purchases\n4) Cut unused subscriptions\n5) Try no-spend challenges\n6) Cook at home more often\n7) Use the envelope method for cash budgets\n\nRemember: Small consistent savings add up to big amounts over time!"
  },
  debt: {
    keywords: ["debt", "loan", "credit", "borrow", "pay off", "creditor", "balance"],
    response: "Debt payoff strategies:\n1) Snowball method - pay smallest debt first for motivation\n2) Avalanche method - pay highest interest first to save money\n3) Pay more than minimums whenever possible\n4) Consider balance transfer for lower rates\n5) Avoid new debt while paying off old\n6) Negotiate with creditors for better terms\n\nWhich method works best depends on your situation - do you need motivation (snowball) or to save money (avalanche)?"
  },
  investing: {
    keywords: ["invest", "investment", "stock", "etf", "fund", "return", "portfolio", "dividend", "trading"],
    response: "Before investing: Build 3-6 month emergency fund first!\n\nInvestment options:\n• Index funds - diversified, low fees, great for beginners\n• ETFs - flexible, trade like stocks\n• Bonds - stable, lower returns\n• Stocks - higher risk/reward\n\nKey principles:\n- Diversify across asset classes\n- Time in the market beats timing the market\n- Start early - compound interest is powerful\n- Consider your risk tolerance and timeline\n\nWant me to explain any of these in more detail?"
  },
  expense: {
    keywords: ["expense", "spend", "spending", "cut cost", "reduce", "cheaper", "save on"],
    response: "To reduce expenses:\n1) Track every spending for a week - you can't manage what you don't measure\n2) Identify patterns - look for recurring costs\n3) Cancel unused subscriptions\n4) Use cashback apps and promo codes\n5) Buy generic brands\n6) Negotiate bills (internet, insurance, phone)\n7) Meal prep instead of eating out\n8) Use public transport or carpool\n\nStart with your largest expenses first - that's where you'll see the biggest savings!"
  },
  income: {
    keywords: ["income", "earn", "salary", "make money", "side hustle", "freelance", "extra money"],
    response: "Ways to increase income:\n1) Ask for a raise - prepare a list of achievements\n2) Develop market-demand skills\n3) Start a side hustle (online tutoring, selling, etc.)\n4) Freelance in your expertise\n5) Invest in certifications\n6) Passive income: dividends, rental, digital products\n7) Negotiate better benefits\n\nMultiple income streams reduce risk and increase financial security!"
  },
  emergency: {
    keywords: ["emergency", "fund", "rainy day", "safety net", "backup"],
    response: "An emergency fund is your financial safety net.\n\nHow much: 3-6 months of essential expenses\nWhere: High-yield savings account (separate from daily spending)\n\nStart small: Even ₱5,000-10,000 helps with small emergencies\nBuild gradually: Set up automatic transfers\n\nWhat counts as emergency: Job loss, medical, car repair - NOT sales or vacations!"
  },
  retirement: {
    keywords: ["retire", "retirement", "pension", "401k", "ira", "savings plan"],
    response: "Retirement planning:\n• Start as early as possible - time is your biggest asset\n• Max out employer 401(k) match - it's free money!\n• Consider Roth IRA for tax-free growth\n• Diversify investments\n• Aim for 15-20% of income\n\nThe power of compound interest: Starting at 25 vs 35 can mean ₱2M+ difference by retirement!\n\nWhat's your current retirement setup?"
  },
  credit: {
    keywords: ["credit score", "credit report", "fico", "credit rating", "credit history"],
    response: "Boost your credit score:\n• Pay bills on time (35% of score) - this is the biggest factor!\n• Keep credit utilization below 30%\n• Don't close old accounts\n• Don't apply for too much credit at once\n• Check your report annually for errors\n\nBuilding credit: Become an authorized user, get a secured card, or use credit-builder loans."
  },
  tax: {
    keywords: ["tax", "taxes", "deduction", "refund", "filing", "bir"],
    response: "Tax tips:\n• Contribute to retirement accounts (tax-deductible)\n• Track business expenses if self-employed\n• Consider HSA for health costs\n• Donations to charity\n• Home office deduction if working remotely\n• Keep all receipts\n\nFor Philippine taxes: Check BIR requirements, consider consulting a CPA for complex situations."
  },
  overspending: {
    keywords: ["overspend", "too much", "control", "discipline", "addicted", "can't stop"],
    response: "Combat overspending:\n1) Delete shopping apps from your phone\n2) Use cash for discretionary purchases\n3) Wait 24-48 hours before non-essential buys\n4) Find free alternatives for entertainment\n5) Unsubscribe from store emails\n6) Identify your triggers\n7) Practice mindful spending\n\nConsider the 'wants vs needs' test: Do I need this, or do I just want it? Will I still want it tomorrow?"
  },
  categories: {
    keywords: ["category", "categories", "track", "group", "classify"],
    response: "Track spending by category to find savings opportunities.\n\nCommon categories:\n• Housing (rent, utilities)\n• Transport (gas, commute)\n• Food (groceries, dining)\n• Utilities (electric, water, internet)\n• Insurance (health, car)\n• Entertainment\n• Personal (shopping, gym)\n• Savings\n\nReview monthly to see where your money actually goes vs where you think it goes!"
  },
  goals: {
    keywords: ["goal", "goals", "target", "milestone", "achieve"],
    response: "Setting financial goals:\n1) Make them Specific - exactly what and how much\n2) Set a deadline - when do you need it?\n3) Break it into monthly targets\n4) Track progress weekly\n5) Celebrate milestones!\n\nSMART goals = Specific, Measurable, Achievable, Relevant, Time-bound\n\nWhat financial goal are you working toward right now?"
  },
  insurance: {
    keywords: ["insurance", "insure", "coverage", "policy", "premium"],
    response: "Types of insurance to consider:\n• Health insurance - critical for medical costs\n• Life insurance - if you have dependents\n• Car insurance - required by law\n• Home insurance - if you own\n• Disability insurance - income protection\n\nStart with health insurance - medical costs can derail finances quickly!\n\nReview your coverage annually to ensure it matches your needs."
  },
  shopping: {
    keywords: ["shop", "shopping", "buy", "purchase", "deal", "discount", "sale"],
    response: "Smart shopping tips:\n1) Make a list and stick to it\n2) Never shop hungry - you'll buy more\n3) Compare prices online before buying\n4) Wait for sales - especially Black Friday, mid-year\n5) Use cashback apps (ShopBack, etc.)\n6) Buy quality over quantity - lasts longer\n7) Return items you don't need\n\nQuestion: Do I need this, or am I buying it because it's on sale?"
  },
  fomo: {
    keywords: ["fomo", "fear of missing out", "regret", "keep up", "social"],
    response: "Avoiding FOMO spending:\n1) Unfollow accounts that trigger spending\n2) Remember: social media shows highlights, not reality\n3) Practice gratitude for what you have\n4) Set a 'cooling off' period for big purchases\n5) Find free or cheap entertainment alternatives\n\nYour financial journey is unique - don't compare your chapter 1 to someone's chapter 20!"
  }
};

function analyzeUserContext(context: UserFinancialContext | null | undefined): string {
  if (!context) return "";
  
  const responses: string[] = [];
  
  if (context.balance < 0) {
    responses.push("⚠️ Your expenses exceed your income this month. Consider reviewing your spending to get back on track.");
  } else if (context.savingsRate < 10) {
    responses.push("💡 Your savings rate is below 20%. Try to increase it by cutting non-essential expenses.");
  } else if (context.savingsRate >= 20) {
    responses.push("🎉 Great job! You're saving 20% or more of your income.");
  }
  
  if (context.budgetsOver.length > 0) {
    responses.push(`⚠️ You've exceeded your budget for: ${context.budgetsOver.join(", ")}. Consider reducing spending in these areas.`);
  }
  
  if (context.topCategories.length > 0) {
    const top = context.topCategories[0];
    responses.push(`📊 Your biggest expense this month is ${top.category} (${formatCurrency(top.amount)}). Is this expected?`);
  }
  
  if (context.savingsGoals.length > 0) {
    const goal = context.savingsGoals.find(g => g.progress >= 75 && g.progress < 100);
    if (goal) {
      responses.push(`🎯 You're close to reaching your "${goal.name}" goal! Keep going!`);
    }
  }
  
  return responses.join("\n\n");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

function findBestMatch(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  for (const data of Object.values(financialKnowledge)) {
    for (const keyword of data.keywords) {
      if (lowerQuery.includes(keyword)) {
        return data.response;
      }
    }
  }
  
  const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you", "what can you do", "who are you"];
  if (greetings.some(g => lowerQuery.includes(g))) {
    return "Hello! 👋 I'm your AI Financial Assistant powered by BudgetPro.\n\nI can help you with:\n\n💰 Budgeting strategies\n💳 Debt repayment tips\n📈 Investment basics\n🎯 Savings goals\n📊 Spending analysis\n🏥 Insurance\n🛒 Smart shopping\n\nTell me about your finances and I'll give personalized advice! What would you like to know?";
  }
  
  const thanks = ["thank", "thanks", "appreciate", "helpful"];
  if (thanks.some(t => lowerQuery.includes(t))) {
    return "You're welcome! 😊 Feel free to ask if you have more financial questions. I'm here to help you achieve your financial goals!\n\nWhat else would you like to know?";
  }
  
  const help = ["help", "help me", "advice", "suggestion", "tips"];
  if (help.some(h => lowerQuery.includes(h))) {
    return "I'd be happy to help! What area of finance would you like advice on?\n\n• Budgeting\n• Saving\n• Debt\n• Investing\n• Taxes\n• Or tell me about your specific situation!";
  }
  
  return "I specialize in financial advice! Try asking about:\n\n📝 Budgeting strategies\n💰 Saving money\n💳 Paying off debt\n📈 Investing basics\n📊 Expense tracking\n🏥 Insurance\n\nOr tell me about your financial situation and I'll give personalized advice!";
}

function getAIResponse(userMessage: string, userContext?: UserFinancialContext | null): string {
  const baseResponse = findBestMatch(userMessage);
  const contextInsights = analyzeUserContext(userContext ?? null);
  
  if (contextInsights) {
    return baseResponse + "\n\n" + contextInsights;
  }
  
  return baseResponse;
}

export function AIChat({ context }: { context?: UserFinancialContext }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! 👋 I'm your AI Financial Assistant.\n\nI can help with:\n\n💰 Budgeting strategies\n💳 Debt repayment tips\n📈 Investment basics\n🎯 Savings goals\n📊 Spending analysis\n\nTell me about your finances or ask me anything! What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(currentInput, context),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
        </div>
      </Button>

      {open && (
        <Card className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] flex flex-col shadow-xl border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">AI Financial Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by BudgetPro</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about finances..."
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}