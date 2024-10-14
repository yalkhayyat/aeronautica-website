"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="flex justify-between m-4 z-50 items-center">
      <Link href={"/"} className="font-semibold sm:block hidden text-lg">
        AEROHUB
      </Link>
      <div className="flex">
        <Link
          href={"/liveries"}
          className="mx-2 text-sm opacity-50 hover:opacity-100 transition-all"
        >
          Liveries
        </Link>
        <Link
          href={"/post"}
          className="mx-2 text-sm opacity-50 hover:opacity-100 transition-all"
        >
          Post
        </Link>
        <Link
          href={"/about"}
          className="mx-2 text-sm opacity-50 hover:opacity-100 transition-all"
        >
          About
        </Link>
      </div>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="border-2 px-3 py-1 rounded-md border-black hover:bg-primary hover:text-secondary transition-all">
            Log in
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
