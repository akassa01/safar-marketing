import Image from "next/image";
import Link from "next/link";
import { APP_STORE_URL } from "@/lib/appStore";

export default function GuideNav() {
  return (
    <nav className="mx-auto flex h-14 max-w-[680px] items-center justify-between px-4">
      <Link href="/" aria-label="Safar home">
        <Image src="/logo.png" alt="Safar" width={36} height={36} className="rounded-lg" priority />
      </Link>
      <a
        href={APP_STORE_URL}
        className="rounded-full border border-dark/20 px-4 py-1.5 text-sm font-medium text-dark transition-colors hover:bg-dark hover:text-background"
      >
        Get the app
      </a>
    </nav>
  );
}
