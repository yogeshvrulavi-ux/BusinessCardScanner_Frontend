import { parseOcrText } from "../src/lib/scanParser.ts";

const samples: Record<string, string> = {
  Olivia: `Olivia Alleppey
Nehru Trophy Boat Race View
Finishing Point
Punnamada Alappuzha
vp@oliviaalleppey.com`,
  DMD: `19/ 526 B, Pynadathu, Millupady, Poickattussery,
Chengamanad PO, Ernakulam - 683578
info@dmdholidays.com`,
  Adventure: `ADVENTURE TOUR
Spiti Tour
Your Journey, Our Passion
spitlehadventuretour@gmail.com`,
  Skyline: `B-2/12, 1st Floor, Mint House Colony,
Nadesar, Varanasi, Pin-221002, (U.P.) India`,
  HRT: `Plot - 1215/1400, Khandagiri Bari, Khandagiri, Bhubaneswar-751030`,
  Seven: `Plot no.: 351
Sipasurubli Mouza, Baliapanda
Puri-752001, Odisha, India`,
  Patra: `Address: Plot No. 1151, Tankapani Road,
Bhubaneswar, Odisha -751018`,
};

for (const [name, text] of Object.entries(samples)) {
  const result = parseOcrText(text);
  console.log("====", name);
  console.log(result.address || "(empty)");
}
