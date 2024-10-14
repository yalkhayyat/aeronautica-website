"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <div className="relative rounded-xl m-2 h-[600px] flex flex-col justify-between bg-gradient-to-t from-black/30 via-black/10 to-black/0">
      <Image
        className="-z-10 object-cover rounded-xl saturate-150 brightness-110"
        src="/a32000.png"
        fill
        alt="Seyo A320neo"
      />
      <div className="flex justify-between z-50 p-2 items-center">
        <Link
          href={"/"}
          className="font-semibold sm:block hidden px-2 text-2xl text-white"
        >
          AEROHUB
        </Link>
        <div className="flex">
          <Link
            href={"/liveries"}
            className="mx-2 opacity-80 hover:opacity-100 transition-all text-white"
          >
            Liveries
          </Link>
          <Link
            href={"/post"}
            className="mx-2 opacity-80 hover:opacity-100 transition-all text-white"
          >
            Post
          </Link>
          <Link
            href={"/about"}
            className="mx-2 opacity-80 hover:opacity-100 transition-all text-white"
          >
            About
          </Link>
        </div>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="border-2 px-3 py-1 rounded-md border-white/80 text-white/80 hover:bg-white hover:text-black/100 transition-all">
              Log in
            </button>
          </SignInButton>
        </SignedOut>
      </div>
      <div className="text-white p-4">
        <div className="text-4xl py-1">Elevate your Aeronautica experience</div>
        <div className="text-sm opacity-80 py-2 w-1/2">
          The central hub for everything Aeronautica. Discover community-made
          liveries, share content, trade, and more.
        </div>
      </div>
    </div>
  );
}
