import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const PLAN_TIERS = {
  pro: {
    price_id: "price_1T5Bx6DQGohKvUIb6ytCwCJK",
    product_id: "prod_U3IYBxyZau1qRK",
  },
  agency: {
    price_id: "price_1T5BxBDQGohKvUIbYKGkPqg2",
    product_id: "prod_U3IYy9ARBh0z8Y",
  },
} as const;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  plan: string;
  subscribed: boolean;
  subscriptionEnd: string | null;
  checkingSubscription: boolean;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  plan: "free",
  subscribed: false,
  subscriptionEnd: null,
  checkingSubscription: false,
  refreshSubscription: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!session) return;
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        setPlan(data.plan || "free");
        setSubscribed(data.subscribed || false);
        setSubscriptionEnd(data.subscription_end || null);
      }
    } catch {
      // silent fail
    } finally {
      setCheckingSubscription(false);
    }
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription on login and periodically
  useEffect(() => {
    if (session) {
      refreshSubscription();
      const interval = setInterval(refreshSubscription, 60000);
      return () => clearInterval(interval);
    } else {
      setPlan("free");
      setSubscribed(false);
      setSubscriptionEnd(null);
    }
  }, [session, refreshSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      plan,
      subscribed,
      subscriptionEnd,
      checkingSubscription,
      refreshSubscription,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
