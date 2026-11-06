import p1 from "./player-portraits/player-portrait-1.svg";
import p2 from "./player-portraits/player-portrait-2.svg";
import p3 from "./player-portraits/player-portrait-3.svg";
import p4 from "./player-portraits/player-portrait-4.svg";
import p5 from "./player-portraits/player-portrait-5.svg";
import p6 from "./player-portraits/player-portrait-6.svg";
import p7 from "./player-portraits/player-portrait-7.svg";
import p8 from "./player-portraits/player-portrait-8.svg";
import p9 from "./player-portraits/player-portrait-9.svg";
import p10 from "./player-portraits/player-portrait-10.svg";
import p11 from "./player-portraits/player-portrait-11.svg";
import p12 from "./player-portraits/player-portrait-12.svg";
import p13 from "./player-portraits/player-portrait-13.svg";
import p14 from "./player-portraits/player-portrait-14.svg";
import p15 from "./player-portraits/player-portrait-15.svg";
import p16 from "./player-portraits/player-portrait-16.svg";
import p17 from "./player-portraits/player-portrait-17.svg";
import p18 from "./player-portraits/player-portrait-18.svg";
import p19 from "./player-portraits/player-portrait-19.svg";
import p20 from "./player-portraits/player-portrait-20.svg";
import p_default from "./player-portraits/player-portrait-default.svg";
import badge_img from "./badge.svg";

const portraits: Record<string, string> = {
  p_default,
  p1,
  p2,
  p3,
  p4,
  p5,
  p6,
  p7,
  p8,
  p9,
  p10,
  p11,
  p12,
  p13,
  p14,
  p15,
  p16,
  p17,
  p18,
  p19,
  p20,
};
export default portraits;

export const defaultPortrait = "p_default";

export const unlockedPortraits: string[] = [
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "p10",
];
export const lockedPortraits: string[] = [
  "p11",
  "p12",
  "p13",
  "p14",
  "p15",
  "p16",
  "p17",
  "p18",
  "p19",
  "p20",
];

export const portraitsAltText: Record<string, string> = {
  p_default: "Nie wybrano ikony.",
  p1: "Nieznajomy w eleganckim stroju biurowym i ciemnym krawacie.",
  p2: "Nieznajomy z eleganckim kokiem, ukrywający się za dużym wachlarzem.",
  p3: "Nieznajomy ze stylowymi białymi włosami i modnym swetrem.",
  p4: "Nieznajomy z jasnymi, kręconymi włosami i ciemnym płaszczem.",
  p5: "Nieznajoma z fryzurą na pazia, fartuchem i dużymi kolczykami.",
  p6: "Nieznajomy z afro w swetrze i kamizelce.",
  p7: "Ciemnowłosy nieznajomy w schludnej bluzce.",
  p8: "Nieznajomy w grubych okularach i szaliku.",
  p9: "Nieznajomy w kurtce sportowej i rozczochranych włosach.",
  p10: "Nieznajomy z przedziałkiem i dużymi słuchawkami.",
  p11: "Nieznajomy w skórzanej kurtce i z bujnym wąsem.",
  p12: "Nieznajomy z kręconymi ciemnymi włosami w jasnym płaszczu.",
  p13: "Nieznajomy w okularach do czytania i eleganckim kapeluszu.",
  p14: "Nieznajomy wyglądający zza gazety.",
  p15: "Łysy, brodaty nieznajomy w schludnym kardiganie.",
  p16: "Nieznajomy z gęstymi białymi włosami w mundurze.",
  p17: "Nieznajomy, który nie jest dwójką dzieci stojących jedno na drugim.",
  p18: "Nieznajomy z długą grzywką zasłaniającą połowę twarzy.",
  p19: "Kot.",
  p20: "Niepokojący nieznajomy skryty w cieniu.",
};

export const badge = badge_img;
