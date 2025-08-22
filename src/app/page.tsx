import { InstagramVideoForm } from "@/features/instagram/components/form";
"use client";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    fetch("/api/log-user");
  }, []);

  return <h1>Hello World</h1>;
}
export default function HomePage() {
  return (
    <div className="flex flex-col py-8">
      <h1 className="text-balance mb-8 text-center text-4xl font-extrabold">
        Instagram Downloader
      </h1>
      <section className="flex flex-col items-center justify-center gap-4">
        <InstagramVideoForm />
      </section>
    </div>
  );
}
