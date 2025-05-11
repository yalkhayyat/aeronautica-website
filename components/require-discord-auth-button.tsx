"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
import React from "react";

interface RequireDiscordAuthButtonProps {
  redirectUrl: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function RequireDiscordAuthButton({
  redirectUrl,
  children,
  className = "",
  ...props
}: RequireDiscordAuthButtonProps) {
  const { signIn } = useSignIn();
  const { isSignedIn } = useUser();

  const handleOAuthSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSignedIn) {
      window.location.href = redirectUrl;
      return;
    }
    await signIn?.authenticateWithRedirect({
      strategy: "oauth_discord",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: redirectUrl,
    });
  };

  return (
    <div
      className={className}
      onClick={handleOAuthSignIn}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
}
