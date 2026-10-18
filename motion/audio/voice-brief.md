# ملخّص التسجيل من واجهة ElevenLabs (للمسار اليدوي)

النموذج: **Eleven v4** (إن لم يظهر فـ Eleven v3). اللغة: العربية. الإعدادات: Stability 30–35%، Similarity 80%، Style 65–75%، Speed 0.93، Speaker boost مفعّل.
الصوت: ذكوري عميق بنبرة وثائقية رسمية، لهجة عربية فصحى بنفَس خليجي إن وُجد في Voice Library.
سجّل كل سطر منفصلاً (3 محاولات لكل سطر ثم اختر الأفضل) وسمِّ الملف كما في العمود الأول.

| الملف | النص (مشكّل) | الأداء المطلوب |
|---|---|---|
| `L1_t1.mp3` | بَالِغُوا بِالدِّفَاعِ عَنْ وَطَنِكُمْ! | نداء قوي حازم، يصعد في «وطنكم» |
| `L2_t1.mp3` | فَالْوَطَنُ… عَقِيدَةٌ… وَكَرَامَةٌ… وَعِزَّةٌ… لَا تُسَاوَمُ! | عاطفة جيّاشة وفخر متصاعد، وقفة قصيرة بعد كل كلمة، وقوة في «لا تساوم» |
| `L3_t1.mp3` | لَا تَسْمَحُوا لِحَاقِدٍ أَوْ خَائِنٍ… أَنْ يَنَالَ مِنْ أَمْنِكُمْ… أَوْ يُشَكِّكَ فِي وَلَائِكُمْ! | غضب مكتوم ثم تحدٍّ صريح |
| `L4_t1.mp3` | فَالْأَوْطَانُ لَا تَحْيَا… إِلَّا بِأَبْنَائِهَا. | حنان وتأثر وفخر، تنخفض النبرة وتعلو في «بأبنائها» |
| `L5_t1.mp3` | الْمَادَّةُ الرَّابِعَةُ وَالثَّلَاثُونَ: الدِّفَاعُ عَنِ الْعَقِيدَةِ الْإِسْلَامِيَّةِ، وَالْمُجْتَمَعِ، وَالْوَطَنِ… وَاجِبٌ عَلَى كُلِّ مُوَاطِنٍ. | رصانة رسمية ثم ارتفاع تدريجي حتى «واجب» |
| `L6_t1.mp3` (اختياري) | بَالِغُوا بِالدِّفَاعِ… عَنْ وَطَنِكُمْ. | ختام واثق مؤثر |

وسوم الأداء مثل `[shouting]` تعمل في النماذج التي تدعمها (v3 وv4 Turbo). إن لم يؤكد نموذجك دعمها لا تكتبها في النص لأنها قد تُنطق.

## الموسيقى (Eleven Music)

مدة 48–50 ثانية، بلا غناء. الوصف:

> Epic cinematic orchestral score with authentic Saudi Arabian character: oud, ney flute, qanun, ardah war-dance frame drums, deep low strings, brass, Hijaz maqam colours. Patriotic, majestic, emotional, about 90 BPM, no vocals.
> 0–6 s slow dark intro, sub drone, solo oud, heartbeat drum, growing awe.
> 6–15 s rising strings and steady ardah drum pulse, a big impact near 12 s.
> 15–25 s tense fierce staccato strings and deep drums, two heavy impacts near 19 s and 21 s, then defiant resolve.
> 25–34 s soaring emotional strings and wordless choir, hopeful, blooming near 31 s.
> 34–43 s solemn majestic ceremonial brass and timpani crescendo to a climax near 40 s.
> 43–49 s triumphant final hit, then sustained strings and gentle oud fading out.

سمِّ الملف `music.mp3` وضعه في `audio/out/`.
