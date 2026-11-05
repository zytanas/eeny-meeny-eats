# Cuisine sticker audit

**Date:** 2026-11-05
**Data:** Local `/api/nearby` with chains hidden and the default 2 km radius. San Manuel, Tarlac widened to 10 km.
**Areas:** Makati, BGC, Quezon City, Baguio, Tagaytay, Vigan, Cebu City, San Manuel (Tarlac)
**Sticker logic checked:** `cuisineArt()` in `src/utils/cuisine.js` as of commit `9b7a8cb`, keyword substring matching with the plate as default
**Method:** Every place name was judged by hand, using knowledge of Filipino food and local brands. The full per-place list with verdicts is in `sticker-audit-places.csv`.

## Summary

| | Places | Share |
|---|---|---|
| Total checked (unique) | 1,173 | 100% |
| Sticker is correct | 498 | 42% |
| **Mismatched** | **432** | **37%** |
| Too vague to tell from the name | 243 | 21% |

| Sticker now | Places | Mismatched | Vague | Correct |
|---|---|---|---|---|
| burger | 273 | 183 | 59 | 31 |
| plate (default) | 409 | 191 | 184 | 34 |
| coffee | 335 | 40 | 0 | 295 |
| rice | 81 | 12 | 0 | 69 |
| noodles | 44 | 6 | 0 | 38 |
| pizza | 29 | 0 | 0 | 29 |
| taco | 2 | 0 | 0 | 2 |

Key findings:

- **Every plain "Fast Food" place gets the burger.** Only 31 of the 273 burger stickers are actual burger places.
- **The plate default hides a lot of identifiable Filipino food.** Bulalo, pares, silog, carinderias and grills all fall back to it.
- **Steak houses get the coffee cup.** The keyword "tea" matches inside "steak".

How places were judged:

- Plain "Fast Food" or "Restaurant" places with no food clue in the name count as **too vague**.
- Places tagged Cafe, Bakery or Ice Cream count as **correct** under the coffee sticker, because those tags are reliable.

Area codes used in the tables: MKT Makati, BGC, QC Quezon City, BAG Baguio, TAG Tagaytay, VIG Vigan, CEB Cebu City, SMT San Manuel (Tarlac).

## Mismatches by what they serve

| What they serve | Places | Should get |
|---|---|---|
| Roast, fried & grilled chicken | 72 | chicken (chicken.svg exists) |
| Silog, carinderia & Filipino ulam | 66 | rice |
| Lechon, liempo, BBQ, steak & grill | 65 | grill (no sticker yet) |
| Bakery, kakanin, donuts & coffee | 46 | coffee |
| Milk tea, juice & drinks | 38 | drinks (soda.svg exists) |
| Porridge & soups (goto, lugaw, bulalo, pares) | 28 | rice |
| Noodles, siomai, dim sum & Chinese | 28 | noodles |
| Street food & snacks | 26 | plate (no fitting sticker) |
| Other Asian (Japanese, Korean, Thai, Indian, Indonesian) | 25 | rice / noodles |
| Pizza, pasta, burgers, sandwiches & tacos | 24 | pizza / burger / sandwich / taco / hotdog |
| Desserts & ice cream | 14 | coffee (dessert) |
| **Total** | **432** | |

## Every mismatch

There are 432 mismatched places. Branches of the same place with the same tag are merged into one row, marked (×N).

**Roast, fried & grilled chicken**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| 24 Chicken | MKT | Fast Food | burger | Fried chicken | chicken (chicken.svg exists) |
| Andok's (×3) | BGC, BAG, VIG | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| Bacolod Chicken Inasal (×2) | MKT, QC | Chicken | burger | Chicken inasal | chicken (chicken.svg exists) |
| Baliwag (×6) | QC, BAG, SMT | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| Baliwag Lechon Manok | QC | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| Binasal | BGC | Filipino | rice | Chicken inasal | chicken (chicken.svg exists) |
| Bonchon Chicken (×4) | MKT, BGC, QC | Chicken | burger | Korean fried chicken | chicken (chicken.svg exists) |
| Buffalo Wild Wings | BGC | Wings | plate | Chicken wings | chicken (chicken.svg exists) |
| Bugóng | MKT | Chicken | burger | Chicken (per its tag) | chicken (chicken.svg exists) |
| CARLITos CRISPY FRied CHicken | CEB | Fast Food | burger | Fried chicken | chicken (chicken.svg exists) |
| Chicken Star (×5) | SMT | Fast Food | burger | Fried chicken | chicken (chicken.svg exists) |
| Chicky'Oink | CEB | Fast Food | burger | Chicken & pork | chicken (chicken.svg exists) |
| Chiks ni Otit | TAG | Restaurant | plate | Chicken | chicken (chicken.svg exists) |
| Chooks to Go (×4) | VIG, SMT | Fast Food | burger | Roast chicken | chicken (chicken.svg exists) |
| Classic Savory | SMT | Restaurant | plate | Fried chicken | chicken (chicken.svg exists) |
| Fowlbread | BGC | American | burger | Fried chicken sandwiches | chicken (chicken.svg exists) |
| Frankie's | BGC | Restaurant | plate | Buffalo wings | chicken (chicken.svg exists) |
| Gringo | MKT | American | burger | Rotisserie chicken | chicken (chicken.svg exists) |
| Homies Chicken | QC | Fast Food | burger | Fried chicken | chicken (chicken.svg exists) |
| House of Inasal and Lechion Belly | TAG | Restaurant | plate | Chicken inasal, lechon belly | chicken (chicken.svg exists) |
| Jo's Chicken Inato | CEB | Restaurant | plate | Chicken inato (grilled) | chicken (chicken.svg exists) |
| JT's Manukan | BGC | Fast Food | burger | Manok / inasal | chicken (chicken.svg exists) |
| JT's Manukan and Grille | QC | Chicken | burger | Manok / inasal | chicken (chicken.svg exists) |
| JT's Manukan Grille | BAG | Filipino | rice | Manok / inasal | chicken (chicken.svg exists) |
| Kara’s Fried Chicken | CEB | Fast Food | burger | Fried chicken | chicken (chicken.svg exists) |
| Kenny Roger's Roasters | BGC | Chicken | burger | Roast chicken | chicken (chicken.svg exists) |
| Kenny Roger's Roasters | QC | Fast Food | burger | Roast chicken | chicken (chicken.svg exists) |
| Kenny Rogers Roasters (×2) | MKT, TAG | Chicken | burger | Roast chicken | chicken (chicken.svg exists) |
| LAL's Chicken | SMT | Fast Food | burger | Chicken | chicken (chicken.svg exists) |
| Lechon Manok ni Sr. Pedro | SMT | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| Mang Bok's Lechon Manok | QC | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| Mang Ted Lechon Manok | TAG | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| Manukan Grille | TAG | Chicken | burger | Manok / inasal | chicken (chicken.svg exists) |
| Max's Restaurant | QC | Chicken | burger | Fried chicken, Filipino | chicken (chicken.svg exists) |
| Max's Restaurant (×6) | MKT, BGC, QC, TAG, VIG, SMT | Asian | rice | Fried chicken, Filipino | chicken (chicken.svg exists) |
| Popeyes (×2) | MKT, QC | Fast Food | burger | Fried chicken | chicken (chicken.svg exists) |
| Roasted Chicken Stalls | BAG | Fast Food | burger | Roast chicken | chicken (chicken.svg exists) |
| Sajang Chicken | QC | Fast Food | burger | Korean fried chicken | chicken (chicken.svg exists) |
| Seven Wings | SMT | Fast Food | burger | Chicken wings | chicken (chicken.svg exists) |
| Sinauna Manokan & Seafoods | TAG | Restaurant | plate | Manokan (grilled chicken), seafood | chicken (chicken.svg exists) |
| Sr. Pedro lechon manok | CEB | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| Tagala's Chicken Butterfly | CEB | Fast Food | burger | Fried chicken (butterfly) | chicken (chicken.svg exists) |
| Tatay Rick Lechon Manok | BGC | Fast Food | burger | Lechon manok | chicken (chicken.svg exists) |
| The Brothers Unli Wings | TAG | Fast Food | burger | Chicken wings | chicken (chicken.svg exists) |
| Wingyard | BAG | Wings | plate | Chicken wings | chicken (chicken.svg exists) |
| Wingyard Tagaytay | TAG | Restaurant | plate | Chicken wings | chicken (chicken.svg exists) |
| Wingyard Vigan | VIG | Restaurant | plate | Chicken wings | chicken (chicken.svg exists) |

**Lechon, liempo, BBQ, steak & grill**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| AA BBQ | CEB | Restaurant | plate | BBQ | grill (no sticker yet) |
| Apl's Ihawan at Kambingan sa Banqueta | QC | Restaurant | plate | Ihaw & kambing | grill (no sticker yet) |
| Bagsik Bagnet | MKT | Fast Food | burger | Bagnet (crispy pork) | grill (no sticker yet) |
| Belen Bacayo Barbeque | CEB | Fast Food | burger | Pork BBQ | grill (no sticker yet) |
| Boq's Roast Shop | CEB | Fast Food | burger | Lechon / roast | grill (no sticker yet) |
| Cebu's Original Lachon Belly | CEB | Fast Food | burger | Lechon belly | grill (no sticker yet) |
| Cesar's Grill | TAG | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Escobar's Steakhouse | QC | Restaurant | plate | Steak | grill (no sticker yet) |
| Esmeraldos Grill | QC | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Eway's Grill | TAG | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Fire Lake Grill | TAG | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Gerry's Grill (×2) | BAG, TAG | Restaurant | plate | Filipino grill | grill (no sticker yet) |
| Gerry's Grill Restaurant | SMT | Restaurant | plate | Filipino grill | grill (no sticker yet) |
| Giligans | TAG | Restaurant | plate | Filipino grill | grill (no sticker yet) |
| Gilligan's Island | BAG | Restaurant | plate | Filipino grill | grill (no sticker yet) |
| Gonzo Grill and Restaurant | MKT | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Grill & Beer | CEB | Fast Food | burger | Grilled meats | grill (no sticker yet) |
| Grill Queen | QC | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Harrison Park Grill & Sizzling Bar | CEB | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Hi-way 22 Resto Grill | VIG | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Hideout Grill | CEB | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Ineng's Special BBQ | MKT | Restaurant | plate | Pork BBQ | grill (no sticker yet) |
| Inihaws | BAG | Restaurant | plate | Inihaw | grill (no sticker yet) |
| KKD stk+bbq | CEB | Regional | plate | Steak & BBQ | grill (no sticker yet) |
| Kubo Grill | BAG | Fast Food | burger | Grilled meats | grill (no sticker yet) |
| Kuya Don Grill Station | CEB | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Liana's Grill | CEB | Fast Food | burger | Grilled meats | grill (no sticker yet) |
| Mang Enciong Lechon | SMT | Fast Food | burger | Lechon | grill (no sticker yet) |
| Mang Jose Lechon and Inasal | TAG | Restaurant | plate | Lechon & inasal | grill (no sticker yet) |
| Mang Larry’s Isawan | QC | Barbecue | plate | Isaw (BBQ) | grill (no sticker yet) |
| Manny's Grill | QC | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Mr. Angus | BAG | Restaurant | plate | Steak | grill (no sticker yet) |
| Mr. Liempo (×2) | TAG, CEB | Fast Food | burger | Liempo | grill (no sticker yet) |
| Nanbantei of Tokyo | BGC | Japanese | noodles | Yakitori | grill (no sticker yet) |
| Nanbantei Yakitori Bar | MKT | Japanese | noodles | Yakitori | grill (no sticker yet) |
| Neo Neo Grill | CEB | Barbecue | plate | Grill | grill (no sticker yet) |
| Nikkei Robata | BGC | Japanese | noodles | Robata grill | grill (no sticker yet) |
| Ol'Days Sangyupsal Unlimited BBQ | TAG | Restaurant | plate | Samgyupsal BBQ | grill (no sticker yet) |
| P'One Grillhouse | CEB | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Panganan Ken Ihawan Toy Vigan | VIG | Restaurant | plate | Inihaw | grill (no sticker yet) |
| Persia Grill | MKT | Mediterranean | plate | Persian grilled kebabs | grill (no sticker yet) |
| Pidong's Grill | QC | Fast Food | burger | Grilled meats | grill (no sticker yet) |
| R. Lapid's Chicharon & Barbeque | TAG | Fast Food | burger | Chicharon & BBQ | grill (no sticker yet) |
| R. Lapid's Chicharon & BBQ | BAG | Fast Food | burger | Chicharon & BBQ | grill (no sticker yet) |
| Reyes Barbeque | MKT | Restaurant | plate | Pork BBQ | grill (no sticker yet) |
| Reynaldo's Smoke House | TAG | Restaurant | plate | Smoked meats | grill (no sticker yet) |
| Rib City | QC | Restaurant | plate | Ribs | grill (no sticker yet) |
| Ribchon Cochinillo | TAG | Restaurant | plate | Lechon / cochinillo | grill (no sticker yet) |
| Ribshack | CEB | Fast Food | burger | Ribs | grill (no sticker yet) |
| Rustic Box Steak and Wine House | BAG | Restaurant | plate | Steak | grill (no sticker yet) |
| Sizzlin' Steak | MKT | Steak House | coffee | Sizzling steak | grill (no sticker yet) |
| Sizzling Plate | BAG | Steak House | coffee | Sizzling steak | grill (no sticker yet) |
| Southpole Ihaw-Ihaw | CEB | Fast Food | burger | Ihaw-ihaw | grill (no sticker yet) |
| Steak House & Japanese Restaurant | TAG | Restaurant | plate | Steak | grill (no sticker yet) |
| Steaks and Toppings | BAG | Restaurant | plate | Steak | grill (no sticker yet) |
| T-Bone King | TAG | American | burger | Steak | grill (no sticker yet) |
| Taloi's Lechon & Tune Panga | CEB | Fast Food | burger | Lechon | grill (no sticker yet) |
| The Butcher Shop & Pub | BGC | Restaurant | plate | Steak | grill (no sticker yet) |
| The Grill by Antonio's | TAG | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Tides Grill & Bistro | TAG | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Uno Grill | VIG | Restaurant | plate | Grilled meats | grill (no sticker yet) |
| Victor's BBQ & Lechon Manok | SMT | Restaurant | plate | BBQ & lechon manok | grill (no sticker yet) |
| YakiMix Prime | BGC | Chinese | noodles | Yakiniku grill | grill (no sticker yet) |

**Porridge & soups (goto, lugaw, bulalo, pares)**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| Apeng's Goto House | BAG | Fast Food | burger | Goto | rice |
| Apostol's Sinanglawan | SMT | Fast Food | burger | Sinanglaw (beef soup) | rice |
| Arlyn and Lyn-lyn Sinanglaw | SMT | Fast Food | burger | Sinanglaw (beef soup) | rice |
| Barako Pares Atbp | TAG | Restaurant | plate | Beef pares | rice |
| Beef Pares | TAG | Restaurant | plate | Beef pares | rice |
| Beef Pares Ni RagDex | CEB | Soup | plate | Beef pares | rice |
| Bobsie's Bulaluhan | BAG | Restaurant | plate | Bulalo | rice |
| Bulalo Capital | TAG | Restaurant | plate | Bulalo | rice |
| Bulalo Point | TAG | Restaurant | plate | Bulalo | rice |
| Bulalo Point Turo-Turo Grill | TAG | Restaurant | plate | Bulalo | rice |
| Diner's Original Bulalo | TAG | Restaurant | plate | Bulalo | rice |
| Don Juan Bulalo | TAG | Regional | plate | Bulalo | rice |
| Goto Believe! | BGC | Restaurant | plate | Goto | rice |
| Goto Ko To | SMT | Fast Food | burger | Goto | rice |
| Goto Sam | SMT | Fast Food | burger | Goto | rice |
| GotoGarahe | SMT | Restaurant | plate | Goto | rice |
| GotoNarra | SMT | Fast Food | burger | Goto | rice |
| Juddie's Bulalohan | TAG | Restaurant | plate | Bulalo | rice |
| Kristine Bulalo & Sisig | TAG | Restaurant | plate | Bulalo & sisig | rice |
| Lugaw Republic | BAG | Fast Food | burger | Lugaw | rice |
| Mr. Pares | TAG | Restaurant | plate | Beef pares | rice |
| Pares ni Nanay | TAG | Restaurant | plate | Beef pares | rice |
| Pares Ni Peso Cembo | BGC | Restaurant | plate | Beef pares | rice |
| Pares Retiro | TAG | Fast Food | burger | Beef pares | rice |
| Riza May Bulalo | TAG | Restaurant | plate | Bulalo | rice |
| Senior Alvino’s Bulalo | TAG | Restaurant | plate | Bulalo | rice |
| sinanglawan | VIG | Fast Food | burger | Sinanglaw (beef soup) | rice |
| Tagaytay Bulaluhan | TAG | Restaurant | plate | Bulalo | rice |

**Silog, carinderia & Filipino ulam**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| Adobo Connection | MKT | Fast Food | burger | Adobo rice meals | rice |
| AMB Filipiniana Restaurant | SMT | Restaurant | plate | Filipino | rice |
| Angelita's Refreshment & Canteen | BAG | Fast Food | burger | Canteen (ulam & rice) | rice |
| Ate Bern Almusal | QC | Fast Food | burger | Almusal / silog | rice |
| Balay Dako (×2) | TAG | Restaurant | plate | Filipino | rice |
| Box O' Rice | QC | Restaurant | plate | Rice meals | rice |
| Brainilicious Tuslob Buwa | CEB | Restaurant | plate | Tuslob buwa with puso | rice |
| Buere's Canteen | TAG | Restaurant | plate | Canteen (ulam & rice) | rice |
| Burnay Restogrille | VIG | Regional | plate | Regional Filipino (per tag) | rice |
| Canteen | QC | Fast Food | burger | Canteen (ulam & rice) | rice |
| ChaoFancylogan | BGC | Fast Food | burger | Chao fan & silog | rice |
| EAMC Coop Canteen | QC | Fast Food | burger | Canteen (ulam & rice) | rice |
| Edsyl Canteen and Refreshment | BAG | Restaurant | plate | Canteen (ulam & rice) | rice |
| Efnancel Eatery | CEB | Fast Food | burger | Eatery (ulam & rice) | rice |
| Elena's Eatery | BAG | Restaurant | plate | Eatery (ulam & rice) | rice |
| Foodmarks Canteen | TAG | Restaurant | plate | Canteen (ulam & rice) | rice |
| Gabby's Canteen | QC | Fast Food | burger | Canteen (ulam & rice) | rice |
| Gerry's Jeepney | QC | Regional | plate | Regional Filipino (per tag) | rice |
| Gi-Atay Formal Canteen | CEB | Restaurant | plate | Canteen (ulam & rice) | rice |
| Golden Gisangag Express | CEB | Fast Food | burger | Sinangag rice meals | rice |
| Halika Cafeteria Block 4 | BGC | Fast Food | burger | Cafeteria (ulam & rice) | rice |
| Jap-jap Eatery | CEB | Fast Food | burger | Eatery (ulam & rice) | rice |
| Jayson Eatery | SMT | Fast Food | burger | Eatery (ulam & rice) | rice |
| Jaytee's | TAG | Regional | plate | Regional Filipino (per tag) | rice |
| Jiji''s Eatery | SMT | Fast Food | burger | Eatery (ulam & rice) | rice |
| JJ Canteen | VIG | Fast Food | burger | Canteen (ulam & rice) | rice |
| Jollikod Eatery | BAG | Fast Food | burger | Eatery (ulam & rice) | rice |
| Juan silog | CEB | Fast Food | burger | Silog | rice |
| Kainan sa 187 | BGC | Fast Food | burger | Kainan (Filipino) | rice |
| Kalye Silog | SMT | Fast Food | burger | Silog | rice |
| Kanteen | BGC | Restaurant | plate | Canteen (ulam & rice) | rice |
| Kuya Roel Tapsilogan | BGC | Fast Food | burger | Silog | rice |
| Lady M | CEB | Regional | plate | Regional Filipino (per tag) | rice |
| Liezel Karenderya | BGC | Restaurant | plate | Carinderia | rice |
| Loi-Loi's Eatery | CEB | Fast Food | burger | Eatery (ulam & rice) | rice |
| LTO - Canteen | TAG | Fast Food | burger | Canteen (ulam & rice) | rice |
| Mama Sisa's Eatery | SMT | Fast Food | burger | Eatery (ulam & rice) | rice |
| Mer-Ben Tapsilogan sa Tagaytay | TAG | Restaurant | plate | Silog | rice |
| Merben Canteen Tapsilog | TAG | Restaurant | plate | Canteen (ulam & rice) | rice |
| Mercado's Eatery | SMT | Fast Food | burger | Eatery (ulam & rice) | rice |
| MGB Canteen | QC | Restaurant | plate | Canteen (ulam & rice) | rice |
| Mommy Eway's Kamayan | TAG | Restaurant | plate | Kamayan (Filipino) | rice |
| Muelle Uno Resto Cafe | CEB | Regional | plate | Regional Filipino (per tag) | rice |
| Nang Pinky's Eatery and Rice Bowls | CEB | Fast Food | burger | Eatery (ulam & rice) | rice |
| Oliver's Carenderia | CEB | Fast Food | burger | Carinderia | rice |
| P. E. Cunanan Lutong Bahay | BAG | Fast Food | burger | Lutong bahay | rice |
| Papa Dong's Restobar | QC | Regional | plate | Regional Filipino (per tag) | rice |
| PATMON'S Eatery | CEB | Restaurant | plate | Eatery (ulam & rice) | rice |
| Precy Eatery | CEB | Fast Food | burger | Eatery (ulam & rice) | rice |
| Recovery Food | BGC | Fast Food | burger | Rice bowls | rice |
| Rodic's Diner | QC | Fast Food | burger | Tapsilog | rice |
| RVE Eatery | CEB | Restaurant | plate | Eatery (ulam & rice) | rice |
| Saingan | QC | Regional | plate | Regional Filipino (per tag) | rice |
| Silog 198 | TAG | Restaurant | plate | Silog | rice |
| Silogan Ni Gian | CEB | Fast Food | burger | Silog | rice |
| Sinangag Express | TAG | Fast Food | burger | Sinangag rice meals | rice |
| Sinangag Station | QC | Fast Food | burger | Sinangag rice meals | rice |
| Sisig Station | BAG | Fast Food | burger | Sisig | rice |
| Tapsilogan by Kristina | TAG | Restaurant | plate | Silog | rice |
| Tito Bee's Eatery | TAG | Restaurant | plate | Eatery (ulam & rice) | rice |
| Tootsie's | TAG | Regional | plate | Regional Filipino (per tag) | rice |
| Tower Canteen | TAG | Restaurant | plate | Canteen (ulam & rice) | rice |
| U and I Canteen | SMT | Fast Food | burger | Canteen (ulam & rice) | rice |
| Vivian Eatery | TAG | Restaurant | plate | Eatery (ulam & rice) | rice |
| Zilog | TAG | Fast Food | burger | Silog | rice |

**Noodles, siomai, dim sum & Chinese**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| Andy's Batangas Lomi and Bulalo | QC | Restaurant | plate | Lomi & bulalo | noodles |
| Andy's famous batangas lomi & bulalo | QC | Fast Food | burger | Lomi & bulalo | noodles |
| David's Tea House Express | BAG | Restaurant | plate | Chinese | noodles |
| Dimsum Break | CEB | Fast Food | burger | Dim sum | noodles |
| Din Tai Fung | BGC | Taiwanese | plate | Taiwanese noodles & dumplings | noodles |
| Dolora's Hauz of Pancit Malabon (Matalino Branch) | QC | Restaurant | plate | Pancit | noodles |
| Hen Lin (×2) | MKT | Fast Food | burger | Siomai & Chinese | noodles |
| JMJC Fried Noodles and Tea House | SMT | Cafe | coffee | Fried noodles | noodles |
| Joshua's Siomai etc | BGC | Fast Food | burger | Siomai | noodles |
| Kowloon House | QC | Fast Food | burger | Chinese | noodles |
| Kusinero Pancit Batil Patong | BAG | Fast Food | burger | Pancit | noodles |
| Lolami-han | BAG | Filipino | rice | Lomi | noodles |
| Mami Goat to Town | BAG | Filipino | rice | Mami | noodles |
| Masingngo Pansit Batil Patong | TAG | Restaurant | plate | Pancit | noodles |
| Master Siomai (×4) | BGC, BAG | Fast Food | burger | Siomai | noodles |
| Mr. Ching Cuisine | BAG | Restaurant | plate | Chinese | noodles |
| Ramen Kuroda | CEB | Restaurant | plate | Ramen | noodles |
| Ramyeon Bar | QC | Korean | rice | Ramyeon | noodles |
| RDM Tagaytay Lomi House | TAG | Restaurant | plate | Lomi | noodles |
| Siomai House | SMT | Fast Food | burger | Siomai | noodles |
| Siomai Madness | CEB | Fast Food | burger | Siomai | noodles |
| Taiwan House | MKT | Taiwanese | plate | Taiwanese noodles & dumplings | noodles |
| Tim Ho Wan | BGC | Restaurant | plate | Dim sum | noodles |
| Wok Your Way | BAG | Restaurant | plate | Stir-fry noodles | noodles |

**Other Asian (Japanese, Korean, Thai, Indian, Indonesian)**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| BAAN - Thai Comfort Food | BAG | Restaurant | plate | Thai | noodles |
| Crazy Katsu | QC | Restaurant | plate | Tonkatsu | rice |
| Dal ROTI Corner | CEB | Cafe | coffee | Indian | rice |
| Desi kitchen | VIG | Restaurant | plate | Indian | rice |
| Hinode Japanese Resto | TAG | Asian | rice | Japanese | noodles |
| Indonyaki | QC | Restaurant | plate | Indonesian | rice |
| Kashmir Biryani Café | BAG | Restaurant | plate | Indian | rice |
| Koreanderia Cupbop | CEB | Fast Food | burger | Korean cupbop | rice |
| Maisen | MKT | Japanese | noodles | Tonkatsu | rice |
| Mango Tree | BGC | Restaurant | plate | Thai | noodles |
| Muang Thai | QC | Restaurant | plate | Thai | noodles |
| Pick a Delhi | BAG | Restaurant | plate | Indian | rice |
| Rasa Baru | MKT | Indonesian | plate | Indonesian | rice |
| Romantic Baboy | QC | Restaurant | plate | Korean BBQ | rice |
| Samgyu Ji Balai | VIG | Restaurant | plate | Korean BBQ | rice |
| Teriyaki Boy | TAG | Restaurant | plate | Teriyaki rice bowls | rice |
| Tokyo Tokyo (×4) | MKT, QC, TAG | Fast Food | burger | Japanese | noodles |
| Tsumura Sushi Bar and Restaurant | MKT | Restaurant | plate | Japanese | noodles |
| Unli 199 Samgyup in Baguio City | BAG | Restaurant | plate | Korean BBQ | rice |
| Warung Indon | QC | Indonesian | plate | Indonesian | rice |
| Yoshinoya | MKT | Fast Food | burger | Gyudon (beef bowl) | rice |
| Yummy Tokyo | QC | Restaurant | plate | Japanese | noodles |

**Bakery, kakanin, donuts & coffee**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| Anaya Cafe and Restaurant | TAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| BLK cafe | QC | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Botan Black Cafe | BGC | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cafe Bigaa | VIG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cafe by the Ruins | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cafe Caridad | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cafe Leona | VIG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cafe Platito Atbp. | TAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cafe Via Mare | BGC | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cafe Will | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Cezve Kahve Cafe | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Coffee Break | VIG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Dean and Deluca | MKT | Restaurant | plate | Bakery / coffee | coffee |
| El Gofre Waffle Station | BAG | Fast Food | burger | Waffles | coffee |
| Flowerscents Garden Cafe | VIG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Honolulu Cafe | MKT | Restaurant | plate | Café (tagged Restaurant) | coffee |
| J.Co (×2) | MKT, BGC | Fast Food | burger | Donuts & coffee | coffee |
| Key Coffee | BGC | Japanese | noodles | Coffee | coffee |
| Little Flour | BGC | Restaurant | plate | Bakery / coffee | coffee |
| Luisa's Cafe | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Mary Grace (×2) | BGC | Regional | plate | Bakery café | coffee |
| Mister Donut (×5) | BAG, SMT | Fast Food | burger | Donuts | coffee |
| Museum Café | MKT | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Nuezca Cafe | QC | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Pancake House (×5) | MKT, BGC, TAG | Restaurant | plate | Pancakes & breakfast | coffee |
| Rainbow Café | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Randy's Donuts | BGC | Fast Food | burger | Donuts & coffee | coffee |
| Single Origin | BGC | Restaurant | plate | Bakery / coffee | coffee |
| Sourdough | MKT | Restaurant | plate | Bakery / coffee | coffee |
| Super Delicious Bakery Inc | CEB | Fast Food | burger | Bakery | coffee |
| Super Heroverse Cafe | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Sweet Smile Cafe | BAG | Fast Food | burger | Cafe | coffee |
| Tam Tam Cafe | BAG | Restaurant | plate | Café (tagged Restaurant) | coffee |
| Turon Express | CEB | Fast Food | burger | Turon | coffee |
| Wildflour | MKT | Restaurant | plate | Bakery / coffee | coffee |
| Wildflour Café | BGC | Restaurant | plate | Café (tagged Restaurant) | coffee |

**Desserts & ice cream**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| Cheesecake, Etc. | MKT | Restaurant | plate | Cakes & sweets | coffee (dessert) |
| Cravings Dessert Bar and Events Place | QC | Restaurant | plate | Desserts | coffee (dessert) |
| Crêpe Glazik | MKT | Restaurant | plate | Crêpes | coffee (dessert) |
| Cupcakes by Gremlins | QC | Restaurant | plate | Cakes & sweets | coffee (dessert) |
| Dairy Queen (×2) | TAG, SMT | Fast Food | burger | Ice cream | coffee (dessert) |
| Dessert Factory | CEB | Restaurant | plate | Desserts | coffee (dessert) |
| Elai’s Sweet Bites | QC | Restaurant | plate | Cakes & sweets | coffee (dessert) |
| Fancy Crepes | QC | Crepe | plate | Crêpes | coffee (dessert) |
| Fling Yogurt | TAG | Fast Food | burger | Frozen yogurt | coffee (dessert) |
| Ice Castle | CEB | Fast Food | burger | Halo-halo & ice cream | coffee (dessert) |
| Papa Churros | CEB | Fast Food | burger | Churros | coffee (dessert) |
| Pinkberry | MKT | Fast Food | burger | Frozen yogurt | coffee (dessert) |
| Ze Creamery | BAG | Restaurant | plate | Ice cream | coffee (dessert) |

**Milk tea, juice & drinks**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| Alishan At The Alley | MKT | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Beau tea Laboba Torycafe | CEB | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Buko Express | BAG | Fast Food | burger | Buko juice | drinks (soda.svg exists) |
| Cha Dao | QC | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Cha Tuk Chak | QC | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Chatime | MKT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| CoCo Fresh Tea & Juice (×2) | BGC | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Gong Cha | BGC | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Halovérs | CEB | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Happy Lemon | BGC | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| I Heart Milktea | SMT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Infinitea | VIG | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Infinitea | QC | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| itealicious | CEB | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Kool O Tea | SMT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Macao Imperial Tea | BGC | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Master Tea | BAG | Fast Food | burger | Milk tea | drinks (soda.svg exists) |
| Milktea Project | SMT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| moonleaf (×3) | QC, BGC, CEB | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Mr. Lemon | CEB | Fast Food | burger | Lemonade | drinks (soda.svg exists) |
| Serenitea | MKT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Sip n Brew Milk Tea | TAG | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Sponteaneous Blendz | SMT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Tea Hive | BAG | Fast Food | burger | Milk tea | drinks (soda.svg exists) |
| Teaberi | MKT | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Tiger Sugar | BGC | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Urban Lemon | BAG | Fast Food | burger | Lemonade | drinks (soda.svg exists) |
| Yi Fang | MKT | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Yi Fang Taiwan Fruit Tea | QC | Fast Food | burger | Milk tea | drinks (soda.svg exists) |
| Yi Fang Tea | MKT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Zagu | BAG | Fast Food | burger | Milk tea | drinks (soda.svg exists) |
| Zagu | SMT | Bubble Tea | coffee | Bubble tea | drinks (soda.svg exists) |
| Zentea (×2) | QC, VIG | Cafe | coffee | Milk tea | drinks (soda.svg exists) |
| Zostful Juice Bar | CEB | Fast Food | burger | Juice | drinks (soda.svg exists) |

**Pizza, pasta, burgers, sandwiches & tacos**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| 7Twenty American Diner | TAG | Restaurant | plate | Burgers / American diner | burger |
| All About Pasta | QC | Restaurant | plate | Italian / pasta | pizza |
| Amare La Cucina | TAG | Restaurant | plate | Italian / pasta | pizza |
| Amici | QC | Restaurant | plate | Italian / pasta | pizza |
| Army Navy | MKT | Cafe | coffee | Burgers & burritos | burger |
| Bacon Buffalo and Beyond | SMT | Restaurant | plate | Burgers / American diner | burger |
| Buon Giorno | TAG | Restaurant | plate | Italian / pasta | pizza |
| Carlo's Pizza | TAG | Restaurant | plate | Pizza | pizza |
| Chimichanga | BAG | Restaurant | plate | Mexican | taco |
| Franks | SMT | Fast Food | burger | Hot dogs | hotdog (hotdog.svg exists) |
| Friuli | QC | Restaurant | plate | Italian / pasta | pizza |
| La Birrieria de Vigan | VIG | Restaurant | plate | Birria | taco |
| Lo de Alberto Taqueria | MKT | Restaurant | plate | Mexican | taco |
| New-O Pasta Cafe | BAG | Cafe | coffee | Italian / pasta | pizza |
| Pizza Telefono | BGC | Restaurant | plate | Pizza | pizza |
| Pound by Todd English | BGC | Restaurant | plate | Burgers / American diner | burger |
| Subway | MKT | Restaurant | plate | Subs | sandwich (sandwich.svg exists) |
| Subway (×4) | MKT, BGC | Sandwich | plate | Subs | sandwich (sandwich.svg exists) |
| Taco x Wings | BAG | Restaurant | plate | Tacos & wings | taco |
| The Sandwich Guy | MKT | Sandwich | plate | Sandwiches / deli | sandwich (sandwich.svg exists) |
| Weber's Delicatessen | TAG | Sandwich | plate | Sandwiches / deli | sandwich (sandwich.svg exists) |

**Street food & snacks**

| Place | Area | Tag | Sticker now | Likely serves | Should get |
|---|---|---|---|---|---|
| Bespren Shawarma | BAG | Fast Food | burger | Shawarma | plate (no better sticker) |
| Boss Rogs Sutukil & Beer | CEB | Fast Food | burger | Seafood (sutukil / paluto) | plate (no better sticker) |
| Casa Jardin Empanada & Okoy | VIG | Fast Food | burger | Empanada | plate (no better sticker) |
| Chinese Ngohiong | CEB | Fast Food | burger | Ngohiong | plate (no better sticker) |
| DC Foodhaus - Pungko-Pungko sa Terminal | CEB | Fast Food | burger | Pungko-pungko | plate (no better sticker) |
| Empanadaan | VIG | Fast Food | burger | Empanada | plate (no better sticker) |
| Fariñas Ilocos Empanada | QC | Fast Food | burger | Empanada | plate (no better sticker) |
| Feta Mediterranean | BGC | Cafe | coffee | Mediterranean | plate (no better sticker) |
| Iloko Empanada | SMT | Fast Food | burger | Empanada | plate (no better sticker) |
| Insiang Empanada | VIG | Cafe | coffee | Empanada | plate (no better sticker) |
| Irene's Empanada | VIG | Cafe | coffee | Empanada | plate (no better sticker) |
| Irene's Empanadas | VIG | Cafe | coffee | Empanada | plate (no better sticker) |
| Jecel Ngohiong | CEB | Fast Food | burger | Ngohiong | plate (no better sticker) |
| Jesus Fries | SMT | Fast Food | burger | Fries | plate (no better sticker) |
| Mamcy's Takoyaki | BAG | Fast Food | burger | Takoyaki | plate (no better sticker) |
| Nadine's Paluto | BGC | Fast Food | burger | Seafood (sutukil / paluto) | plate (no better sticker) |
| Nanag Sion - Vigan Empanada | VIG | Fast Food | burger | Empanada | plate (no better sticker) |
| Ngohiong Dynasty | CEB | Fast Food | burger | Ngohiong | plate (no better sticker) |
| Ngohiong Express | CEB | Fast Food | burger | Ngohiong | plate (no better sticker) |
| Patata Pungko Pungko | BAG | Fast Food | burger | Pungko-pungko | plate (no better sticker) |
| Potato Corner | QC | Fast Food | burger | Fries | plate (no better sticker) |
| Salad Stop | MKT | Fast Food | burger | Salads | plate (no better sticker) |
| Turks (×2) | BAG, TAG | Fast Food | burger | Shawarma | plate (no better sticker) |
| Turks Shawarma | BGC | Fast Food | burger | Shawarma | plate (no better sticker) |
| Zeiger Takoyaki | BGC | Fast Food | burger | Takoyaki | plate (no better sticker) |

## Name keywords that would have caught them

Keywords match whole words. A trailing `*` means "the word starts with this". `*tea` means "the word ends in tea". Never let a keyword match a bare substring, or "steak" will match "tea" again.

| Group | Keywords |
|---|---|
| Chicken | chicken, chiks, chooks, manok, manukan, manokan, lechon manok, inasal, binasal, inato, wings, roasters, bonchon, popeyes, andok, baliwag, savory, wingyard |
| Grill | grill\*, ihaw\*, inihaw\*, isaw\*, bbq, barbecue, barbeque, lechon, lachon, liempo, bagnet, chicharon, rib\*, steak\*, sizzling, sizzlin, smoke house, roast\*, butcher, cochinillo, yakitori, robata, yakimix |
| Porridge & soups | goto\*, lugaw\*, bulalo\*, bulaluhan, pares, sinanglaw\* |
| Silog & ulam | \*silog\*, sinangag, gisangag, eatery, canteen, kanteen, cafeteria, carinderia, carenderia, karenderya, lutong bahay, kainan, almusal, sisig, adobo, kamayan, filipiniana, tuslob, rice. Also treat the **Regional** tag as rice. |
| Noodles & Chinese | lomi\*, mami, pancit, pansit, batil patong, siomai, dimsum, dim sum, ramen, ramyeon, noodle\*, wok, kowloon, hen lin, tim ho wan, din tai fung, taiwan |
| Other Asian | thai, katsu, teriyaki, sushi, tokyo, yoshinoya, cupbop, samgyup\*, sangyupsal, baboy, biryani, delhi, desi, indon\*, warung |
| Bakery & coffee | cafe, café, coffee, kape\*, kahve, bakery, bakeshop, panaderia, pandesal\*, donut\*, waffle\*, pancake\*, sourdough, flour, turon, bibingka, puto, kakanin |
| Desserts | dessert\*, ice cream, creamery, gelato, yogurt, halo-halo, churros, crepe\*, crêpe\*, cheesecake, cupcake\*, cake\*, sweet\* |
| Drinks | milk tea, milktea, \*tea (Serenitea, Infinitea, Zentea), itea\*, teaberi, juice, lemon\*, buko, zagu, boba, cha dao |
| Pizza / burger / sandwich / taco | pizza\*, pizzeria, pasta, cucina, trattoria, giorno, burger\*, diner, subway, sandwich, deli\*, taco\*, taqueria, birria\*, chimichanga, franks, hotdog |
| Street food | empanada\*, ngohiong, okoy, pungko, takoyaki, shawarma, kebab, fries, potato, salad, paluto, sutukil |

## Chains that weren't filtered out

84 brands with 215 branches got past `CHAIN_BLOCKLIST` in `netlify/lib/config.js`. Two names look like misspellings that slip past matching:

- **"Jolibee"** (one L) in Tagaytay. The blocklist's "Jollibee" entry doesn't catch it.
- **"Angle's"**, a misspelling of Angel's Burger.

| Type | Brand (branches) |
|---|---|
| Chicken / lechon manok | Max's Restaurant (7), Baliwag Lechon Manok (7), Chooks to Go (4), Bonchon (4), Kenny Rogers (4), Andok's (3), Wingyard (3), Sr. Pedro Lechon Manok (2), Popeyes (2), Bacolod Chicken Inasal (2), 24 Chicken (1), Classic Savory (1), Buffalo Wild Wings (1), Frankie's (1) |
| Burgers & American | Angel's Burger (6), Army Navy (6), Minute Burger (3), Tropical Hut (2), Jolibee (1), Big Mak (1), Shake Shack (1), TGI Fridays (1), Texas Roadhouse (1) |
| Grill & lechon | Gerry's Grill (3), Gilligan's (2), Mr. Liempo (2), R. Lapid's (2), Ribshack (1), Ineng's BBQ (1) |
| Siomai, Chinese & Asian | Tokyo Tokyo (5), Master Siomai (4), Hen Lin (2), Samgyupsalamat (2), Romantic Baboy (2), Siomai House (1), Kowloon House (1), Yoshinoya (1), Teriyaki Boy (1), Tim Ho Wan (1), Din Tai Fung (1) |
| Filipino | Pancake House (5), Mary Grace (2), Sinangag Express (1), Tapa King (1), Adobo Connection (1), Seafood Island (1) |
| Pizza, subs & snacks | Subway (5), Turks (4), Angel's Pizza (3), Sbarro (1), Italianni's (1), Potato Corner (1), Shawarma Shack (1) |
| Bakeries & donuts | Pan de Manila (9), Julie's Bakeshop (8), Goldilocks (6), Mister Donut (6), Red Ribbon (5), J.Co (2), Krispy Kreme (2), BreadTalk (1), Tous les Jours (1) |
| Coffee | Coffee Bean & Tea Leaf (7), Bo's Coffee (5), ZUS Coffee (4), Pickup Coffee (4), Figaro (3), Seattle's Best (3), Don Macchiatos (2), Tim Hortons (1), Coffee Project (1) |
| Milk tea | Moonleaf (3), Yi Fang (3), Zagu (2), CoCo (2), Infinitea (2), Zentea (2), Serenitea (1), Gong Cha (1), Chatime (1), Tiger Sugar (1), Happy Lemon (1) |
| Desserts | Dairy Queen (2), Pinkberry (1) |
