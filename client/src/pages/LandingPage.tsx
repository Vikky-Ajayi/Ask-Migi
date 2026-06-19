import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const audienceOptions = ["Immigration Experts", "Travel agents", "Tour Guides"];

export const LandingPage = (): JSX.Element => {
  const [selectedAudience, setSelectedAudience] = useState(
    "Immigration Experts",
  );

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col px-4 pb-8">
        <header className="sticky top-0 z-10 -mx-4 flex h-20 items-center justify-between px-4 backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)]">
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 rounded-full p-0 hover:bg-white/5"
            aria-label="Open navigation menu"
          >
            <img
              className="h-6 w-6"
              alt="Icons ham burger"
              src="/figmaAssets/icons-ham-burger.svg"
            />
          </Button>
          <img
            className="h-8 w-[132.92px]"
            alt="Vector"
            src="/figmaAssets/vector.svg"
          />
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 rounded-full p-0 hover:bg-white/5"
            aria-label="Open profile"
          >
            <img
              className="h-10 w-10"
              alt="Frame"
              src="/figmaAssets/frame-1410105890.svg"
            />
          </Button>
        </header>
        <section className="mt-[99px] flex flex-col gap-8">
          <div className="flex flex-col items-center gap-5">
            <img
              className="h-14 w-[232.61px]"
              alt="Vector"
              src="/figmaAssets/vector.svg"
            />
            <p className="self-stretch text-center [font-family:'Roobert_TRIAL-Medium',Helvetica] text-sm font-medium leading-[21px] tracking-[-0.28px] text-[#ffffffcc]">
              Get expert immigration guidance every step of the way, whether
              visiting, relocating, or pursuing citizenship, our experts help
              you settle with confidence.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <nav
              aria-label="Audience selection"
              className="overflow-x-auto pb-1"
            >
              <div className="flex min-w-max items-start gap-3 pr-4">
                {audienceOptions.map((option) => {
                  const isActive = selectedAudience === option;

                  return (
                    <Button
                      key={option}
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedAudience(option)}
                      className={`h-8 rounded-[48px] px-4 py-3 [font-family:'Roobert_TRIAL-Medium',Helvetica] text-xs font-medium leading-[18px] tracking-[-0.24px] ${
                        isActive
                          ? "bg-white text-black hover:bg-white/90"
                          : "bg-[#242628] text-white hover:bg-[#2b2d2f]"
                      }`}
                    >
                      <span className="mt-[-2px] opacity-80">{option}</span>
                    </Button>
                  );
                })}
              </div>
            </nav>
            <Card className="rounded-3xl border border-solid border-[#3a3c3e] bg-[#242628] shadow-none">
              <CardContent className="flex flex-col gap-14 px-2 pb-2 pt-6">
                <div className="flex items-center gap-2 px-2">
                  <p className="flex-1 [font-family:'Roobert_TRIAL-Medium',Helvetica] text-base font-medium leading-6 tracking-[-0.32px] text-[#fcfcfccc] opacity-80">
                    |What do you want to know?
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <img
                    className="h-10 shrink-0"
                    alt="Frame"
                    src="/figmaAssets/frame-1410105905.svg"
                  />
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 items-center justify-center gap-1 rounded-[48px] border border-solid border-[#3a3c3e] px-2 py-3">
                      <div className="inline-flex items-center gap-1">
                        <img
                          className="h-5 w-5 object-cover"
                          alt="Image"
                          src="/figmaAssets/image-2.png"
                        />
                        <span className="whitespace-nowrap [font-family:'Roobert_TRIAL-Medium',Helvetica] text-sm font-medium leading-[21px] tracking-[-0.28px] text-[#fcfcfccc] opacity-80">
                          3 Coins/question
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-10 rounded-full p-0 hover:bg-white/5"
                      aria-label="Submit question"
                    >
                      <img
                        className="h-10 w-10"
                        alt="Frame"
                        src="/figmaAssets/frame-1410105889.svg"
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <footer className="mt-[180px] self-center">
          <p className="w-full max-w-[343px] text-center [font-family:'Roobert_TRIAL-Medium',Helvetica] text-base font-normal leading-6 tracking-[-0.32px] text-[#fcfcfccc]">
            <span className="font-medium tracking-[-0.05px]">
              By messaging Ask MiGi, you agree to our{" "}
            </span>
            <span className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">
              Terms of Use,
            </span>
            <span className="font-medium tracking-[-0.05px]"> </span>
            <span className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">
              Privacy Policy
            </span>
            <span className="font-medium tracking-[-0.05px]">, </span>
            <span className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">
              Disclaimer
            </span>
            <span className="font-medium tracking-[-0.05px]"> and </span>
            <span className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">
              Refund Policy
            </span>
            <span className="font-medium tracking-[-0.05px]">.</span>
          </p>
        </footer>
      </div>
    </main>
  );
};
