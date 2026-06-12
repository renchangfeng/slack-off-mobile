import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { env } from "../config/env";
import { captureError, logEvent } from "../observability/logger";
import { isSupabaseConfigured, supabase } from "./supabase";

export type AuthMode = "loading" | "authenticated" | "development" | "signedOut" | "error";

export type AuthState = {
  mode: AuthMode;
  email?: string;
  error?: string;
  getAccessToken: () => Promise<string | null>;
  signInWithEmail: (email: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
};

export function useAuthSession(): AuthState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) {
          return;
        }

        if (sessionError) {
          setError(sessionError.message);
        }
        setSession(data.session);
      })
      .catch((sessionError: unknown) => {
        if (!mounted) {
          return;
        }
        setError("无法恢复登录状态。");
        captureError(sessionError, "auth.session.restore_failed");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const getAccessToken = useCallback(async () => {
    if (session?.access_token) {
      return session.access_token;
    }

    return env.accessToken;
  }, [session]);

  const signInWithEmail = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { ok: false, message: "先填邮箱，系统才知道该把入口藏哪。" };
    }

    if (!supabase) {
      return {
        ok: false,
        message: "还没有配置 Supabase URL 和 publishable key。"
      };
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalized
    });

    if (signInError) {
      setError(signInError.message);
      logEvent("warn", "auth.email_otp.failed", {
        message: signInError.message
      });
      return { ok: false, message: signInError.message };
    }

    logEvent("info", "auth.email_otp.requested", {
      appEnv: env.appEnv
    });
    return { ok: true, message: "登录邮件已发送，去邮箱里捞一下。" };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        return;
      }
    }
    setSession(null);
  }, []);

  return useMemo(() => {
    if (loading) {
      return {
        mode: "loading",
        error: undefined,
        getAccessToken,
        signInWithEmail,
        signOut
      };
    }

    if (session) {
      return {
        mode: "authenticated",
        email: session.user.email,
        error: error ?? undefined,
        getAccessToken,
        signInWithEmail,
        signOut
      };
    }

    if (env.accessToken) {
      return {
        mode: "development",
        email: "local dev token",
        error: error ?? undefined,
        getAccessToken,
        signInWithEmail,
        signOut
      };
    }

    if (!isSupabaseConfigured) {
      return {
        mode: "error",
        error: "未配置 Supabase 登录，也没有本地开发 token。",
        getAccessToken,
        signInWithEmail,
        signOut
      };
    }

    return {
      mode: "signedOut",
      error: error ?? undefined,
      getAccessToken,
      signInWithEmail,
      signOut
    };
  }, [error, getAccessToken, loading, session, signInWithEmail, signOut]);
}
