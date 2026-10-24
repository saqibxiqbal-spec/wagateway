/** ISLAMIC: Quran, hadith, duas, prayer times, names, tasbeeh. */

const { fetchJson, pick } = require('./_util');
const { bulk } = require('./_bulk');

const DUAS = [
  ['Subah uthne ki dua', '\u0627\u0644\u062d\u0645\u062f \u0644\u0644\u06c1 \u0627\u0644\u0630\u06cc \u0627\u062d\u06cc\u0627\u0646\u0627 \u0628\u0639\u062f \u0645\u0627 \u0627\u0645\u0627\u062a\u0646\u0627 \u0648\u0627\u0644\u06cc\u06c1 \u0627\u0644\u0646\u0634\u0648\u0631'],
  ['Sone ki dua', '\u0628\u0633\u0645\u06a9 \u0627\u0644\u0644\u06be\u0645 \u0627\u0645\u0648\u062a \u0648\u0627\u062d\u06cc\u0627'],
  ['Khane se pehle', '\u0628\u0633\u0645 \u0627\u0644\u0644\u06c1'],
  ['Khane ke baad', '\u0627\u0644\u062d\u0645\u062f \u0644\u0644\u06c1 \u0627\u0644\u0630\u06cc \u0627\u0637\u0639\u0645\u0646\u0627 \u0648\u0633\u0642\u0627\u0646\u0627'],
  ['Safar ki dua', '\u0633\u0628\u062d\u0627\u0646 \u0627\u0644\u0630\u06cc \u0633\u062e\u0631 \u0644\u0646\u0627 \u06c1\u0630\u0627'],
  ['Pareshani ki dua', '\u0644\u0627 \u0627\u0644\u06c1 \u0627\u0644\u0627 \u0627\u0646\u062a \u0627\u0644\u0627 \u0627\u0646\u062a \u0638\u0644\u0645\u062a \u0646\u0641\u0633\u06cc'],
];

const HADITH = [
  'Nabi (SAW) ne farmaya: "Muslim wo hai jis ki zuban aur haath se doosre Muslim mehfooz rahein." \u2014 Bukhari',
  'Nabi (SAW) ne farmaya: "Jannat maa ke qadmon ke neeche hai."',
  'Nabi (SAW) ne farmaya: "Ilm haasil karna har Muslim par farz hai." \u2014 Ibn Majah',
  'Nabi (SAW) ne farmaya: "Sabse achha insaan wo hai jo doosron ke liye faidemand ho."',
  'Nabi (SAW) ne farmaya: "Muskurayein, yeh sadqa hai." \u2014 Tirmizi',
  'Nabi (SAW) ne farmaya: "Safai aadha imaan hai." \u2014 Muslim',
  'Nabi (SAW) ne farmaya: "Walidain ki khidmat karo, jannat milegi."',
];

const NAMES_BOYS = ['Muhammad', 'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Usman', 'Umar', 'Bilal', 'Hamza', 'Zaid', 'Saad', 'Talha', 'Ibrahim', 'Yusuf', 'Ismail', 'Abdullah', 'Abdul Rahman', 'Khalid', 'Salman', 'Faisal'];
const NAMES_GIRLS = ['Fatima', 'Ayesha', 'Khadija', 'Zainab', 'Maryam', 'Hafsa', 'Sana', 'Aisha', 'Amina', 'Safia', 'Ruqayya', 'Sumayya', 'Noor', 'Iman', 'Hiba', 'Sara', 'Layla', 'Yasmin', 'Rabia', 'Zara'];

module.exports = (def, defMany) => {
  def({ name: ['dua', 'duain'], category: 'islamic', desc: '.dua \u2014 dua', run: async () => { const d = pick(DUAS); return `\ud83e\udd32 *${d[0]}*\n\n${d[1]}`; } });
  def({ name: ['hadith', 'hadees'], category: 'islamic', desc: '.hadith \u2014 hadith', run: async () => `\ud83d\udcd6 ${pick(HADITH)}` });
  def({ name: ['ayat', 'quranayat', 'verse'], category: 'islamic', desc: '.ayat \u2014 Quran ayat', run: async () => `\ud83d\udcd6 ${pick(['"Beshak Allah sabr karne walon ke saath hai." (Al-Baqarah 2:153)', '"Aur Allah se madad maango sabr aur namaz ke zariye." (Al-Baqarah 2:45)', '"Beshak mushkil ke saath aasani hai." (Ash-Sharh 94:5)'])}` });
  def({ name: ['surah', 'surahinfo'], category: 'islamic', desc: '.surah <name>', run: async (ctx) => `\ud83d\udcd6 Surah: *${ctx.args.join(' ') || 'Al-Fatiha'}* \u2014 Quran ki aayat parhne ke liye `.ayat` use karein.` });
  def({ name: ['tasbeeh', 'dhikr'], category: 'islamic', desc: '.tasbeeh \u2014 dhikr', run: async () => `\ud83d\udcff ${pick(['SubhanAllah (33x)', 'Alhamdulillah (33x)', 'Allahu Akbar (34x)', 'La ilaha illallah', 'Astaghfirullah (100x)'])}` });
  def({ name: ['99names', 'asmaulhusna'], category: 'islamic', desc: '.99names', run: async () => `\ud83d\udcff Allah ke 99 naam: Ar-Rahman, Ar-Raheem, Al-Malik, Al-Quddus, As-Salam...` });
  def({ name: ['prayer', 'namaz', 'salah', 'prayertimes'], category: 'islamic', desc: '.prayer <city> \u2014 namaz times',
    run: async (ctx) => {
      const city = ctx.args.join(' ') || 'Lahore';
      try {
        const d = await fetchJson(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=PK&method=1`);
        const t = d.data.timings;
        return `\ud83d\udd4c *Namaz Times \u2014 ${city}*\n\u2022 Fajr: ${t.Fajr}\n\u2022 Dhuhr: ${t.Dhuhr}\n\u2022 Asr: ${t.Asr}\n\u2022 Maghrib: ${t.Maghrib}\n\u2022 Isha: ${t.Isha}`;
      } catch {
        return `\ud83d\udd4c Namaz times abhi available nahi. (${city})`;
      }
    } });
  def({ name: ['qibla', 'qibladirection'], category: 'islamic', desc: '.qibla <city>', run: async (ctx) => `\ud83e\udded Qibla direction for *${ctx.args.join(' ') || 'your city'}*: Makkah ki taraf. (Compass se check karein.)` });
  def({ name: ['hijri', 'hijridate', 'islamicdate'], category: 'islamic', desc: '.hijri \u2014 Hijri date', run: async () => `\ud83d\udcc5 Hijri date: *${new Date().toLocaleDateString('en-TN-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' })}*` });
  def({ name: ['ramadan', 'roza'], category: 'islamic', desc: '.ramadan \u2014 roza info', run: async () => `\ud83c\udf19 Ramadan Mubarak! Sehri aur Iftar ke times `.prayer <city>` se dekhein.` });
  def({ name: ['eid', 'eidmubarak'], category: 'islamic', desc: '.eid', run: async () => `\ud83c\udf89 Eid Mubarak! Allah aap sab ki ibadat qubool kare.` });
  def({ name: ['jummah', 'friday'], category: 'islamic', desc: '.jummah', run: async () => `\ud83d\udd4c Jummah Mubarak! Surah Al-Kahf parhna sunnat hai.` });
  def({ name: ['sadaqah', 'charity'], category: 'islamic', desc: '.sadaqah', run: async () => `\ud83e\udd32 Sadaqah sadqa hai \u2014 jitna ho sake kharch karein.` });
  def({ name: ['zakat2', 'zakatinfo'], category: 'islamic', desc: '.zakat2', run: async () => `\ud83d\udcb0 Zakat: saal mein ek baar, 2.5% savings par (nisab ke baad).` });
  def({ name: ['wudu', 'ablution'], category: 'islamic', desc: '.wudu', run: async () => `\ud83d\udca7 Wudu ke farz: chehra, haath (kohniyon tak), sar ka masah, paon (takhnon tak).` });
  def({ name: ['kalima', 'shahada'], category: 'islamic', desc: '.kalima', run: async () => `\u262a\ufe0f La ilaha illallah Muhammadur Rasulullah.` });
  def({ name: ['bismillah', 'bismillah2'], category: 'islamic', desc: '.bismillah', run: async () => `\u0628\u0633\u0645 \u0627\u0644\u0644\u06c1 \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u0631\u062d\u06cc\u0645` });
  def({ name: ['islamicname', 'muslimname'], category: 'islamic', desc: '.islamicname <boy|girl>', run: async (ctx) => { const g = (ctx.args[0] || '').toLowerCase(); return g === 'girl' ? `\ud83d\udc97 ${pick(NAMES_GIRLS)}` : `\ud83d\udc99 ${pick(NAMES_BOYS)}`; } });
  def({ name: ['duafor', 'duafor2'], category: 'islamic', desc: '.duafor <person>', run: async (ctx) => `\ud83e\udd32 Allah *${ctx.args.join(' ') || 'sab'}* ko khush rakhe, sehat de, aur kamyabi ata kare. Ameen.` });
  def({ name: ['astaghfirullah', 'istighfar'], category: 'islamic', desc: '.astaghfirullah', run: async () => `\ud83e\udd32 Astaghfirullah (100x) \u2014 Allah maaf kare.` });
  def({ name: ['salawat', 'durood'], category: 'islamic', desc: '.salawat', run: async () => `\ud83e\udd32 \u0627\u0644\u0644\u06be\u0645 \u0635\u0644 \u0639\u0644\u06cc \u0645\u062d\u0645\u062f` });
  def({ name: ['islamicquote', 'islamquote'], category: 'islamic', desc: '.islamicquote', run: async () => `\u262a\ufe0f ${pick(HADITH)}` });

  bulk(defMany, 'islamic', [
    { names: ['islam', 'islamic'], desc: 'Islam', replies: ['\u262a\ufe0f Islam \u2014 aman aur sukoon ka deen.'] },
    { names: ['muslim', 'musliminfo'], desc: 'Muslim', replies: ['\u262a\ufe0f Muslim wo hai jis ki zuban aur haath se doosre mehfooz rahein.'] },
    { names: ['quran', 'quraninfo'], desc: 'Quran', replies: ['\ud83d\udcd6 Quran mein 114 surah aur 30 para hain.'] },
    { names: ['sunnah', 'sunnahinfo'], desc: 'Sunnah', replies: ['\ud83d\udcd6 Sunnah \u2014 Nabi (SAW) ka tareeqa.'] },
    { names: ['imaan', 'faith'], desc: 'Imaan', replies: ['\u262a\ufe0f Imaan ke 6 arkaan: Allah, Farishte, Kitabein, Rasool, Qayamat, Taqdeer.'] },
    { names: ['islamicmonths', 'hijrimonths'], desc: 'Islamic months', replies: ['\ud83d\udcc5 Muharram, Safar, Rabi-ul-Awwal, Rabi-us-Sani, Jamadi-ul-Awwal, Jamadi-us-Sani, Rajab, Shaban, Ramadan, Shawwal, Zil-Qadah, Zil-Hijjah'] },
    { names: ['islamicdays', 'days'], desc: 'Islamic days', replies: ['\ud83d\udcc5 Jummah, Eid-ul-Fitr, Eid-ul-Adha, Ashura, Shab-e-Barat, Shab-e-Qadr'] },
    { names: ['islamicfestivals', 'festivals'], desc: 'Festivals', replies: ['\ud83c\udf89 Eid-ul-Fitr, Eid-ul-Adha, Muharram, Ramadan'] },
    { names: ['masjid', 'mosque'], desc: 'Masjid', replies: ['\ud83d\udd4c Masjid \u2014 Allah ka ghar.'] },
    { names: ['kaaba', 'makkah'], desc: 'Kaaba', replies: ['\ud83d\udd4b Kaaba \u2014 Makkah Mukarramah.'] },
    { names: ['madina', 'medina'], desc: 'Madina', replies: ['\ud83d\udd4c Madina Munawwarah \u2014 Nabi (SAW) ka shehar.'] },
    { names: ['hajj', 'hajjinfo'], desc: 'Hajj', replies: ['\ud83d\udd4b Hajj \u2014 Islam ka 5th arkaan, zindagi mein ek baar.'] },
    { names: ['umrah', 'umrahinfo'], desc: 'Umrah', replies: ['\ud83d\udd4b Umrah \u2014 chhota hajj, kabhi bhi.'] },
    { names: ['fasting', 'roza2'], desc: 'Fasting', replies: ['\ud83c\udf19 Roza \u2014 subah se shaam tak khane peene se parhez.'] },
    { names: ['sadaqah2', 'khairat'], desc: 'Sadaqah', replies: ['\ud83e\udd32 Sadaqah \u2014 Allah ki raah mein kharch.'] },
    { names: ['tawbah', 'repent'], desc: 'Tawbah', replies: ['\ud83e\udd32 Tawbah \u2014 Allah se maafi maangna.'] },
    { names: ['jannah', 'paradise'], desc: 'Jannah', replies: ['\ud83c\udf3f Jannah \u2014 nek logon ka inaam.'] },
    { names: ['jahannam', 'hell'], desc: 'Jahannam', replies: ['\ud83d\udd25 Jahannam \u2014 buray logon ka anjaam.'] },
    { names: ['angel', 'farishta'], desc: 'Angels', replies: ['\ud83d\udc7c Farishte \u2014 Allah ke noor se banaye gaye.'] },
    { names: ['prophet', 'nabi'], desc: 'Prophets', replies: ['\u262a\ufe0f Allah ne 124,000 nabiyon ko bheja.'] },
    { names: ['sahaba', 'companions'], desc: 'Sahaba', replies: ['\u262a\ufe0f Sahaba \u2014 Nabi (SAW) ke saathi.'] },
    { names: ['ahlulbayt', 'family'], desc: 'Ahlul Bayt', replies: ['\u262a\ufe0f Ahlul Bayt \u2014 Nabi (SAW) ka khandan.'] },
    { names: ['islamicgreeting', 'assalamualaikum'], desc: 'Greeting', replies: ['\u0648\u0639\u0644\u06cc\u06a9\u0645 \u0627\u0644\u0633\u0644\u0627\u0645 \u0648\u0631\u062d\u0645\u062a\u06c1 \u0627\u0644\u0644\u06c1'] },
    { names: ['inshallah', 'inshaallah'], desc: 'Inshallah', replies: ['\u0627\u0646 \u0634\u0627 \u0627\u0644\u0644\u06c1'] },
    { names: ['mashallah', 'mashaallah'], desc: 'Mashallah', replies: ['\u0645\u0627 \u0634\u0627 \u0627\u0644\u0644\u06c1'] },
    { names: ['alhamdulillah', 'thanks_allah'], desc: 'Alhamdulillah', replies: ['\u0627\u0644\u062d\u0645\u062f \u0644\u0644\u06c1'] },
    { names: ['subhanallah', 'glory'], desc: 'Subhanallah', replies: ['\u0633\u0628\u062d\u0627\u0646 \u0627\u0644\u0644\u06c1'] },
    { names: ['allahuakbar', 'takbir'], desc: 'Allahu Akbar', replies: ['\u0627\u0644\u0644\u06c1 \u0627\u06a9\u0628\u0631'] },
  ]);
};
