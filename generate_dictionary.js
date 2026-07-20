import fs from 'fs';

const dictionary = [
  {
    "word": "hello",
    "ipa": "/heˈloʊ/",
    "ar": "مرحباً",
    "type": "interjection",
    "synonyms": ["hi", "greetings", "hey"],
    "antonyms": ["goodbye", "bye"],
    "sentences": [
      { "en": "Hello, how are you today?", "ar": "مرحباً، كيف حالك اليوم؟" },
      { "en": "Say hello to your brother for me.", "ar": "سلم لي على أخيك." }
    ],
    "level": "a1"
  },
  {
    "word": "beautiful",
    "ipa": "/ˈbjuːtɪfl/",
    "ar": "جميل",
    "type": "adjective",
    "synonyms": ["pretty", "lovely", "attractive"],
    "antonyms": ["ugly", "unattractive"],
    "sentences": [
      { "en": "She has a beautiful voice.", "ar": "لديها صوت جميل." },
      { "en": "What a beautiful day!", "ar": "يا له من يوم جميل!" }
    ],
    "level": "a1"
  },
  {
    "word": "important",
    "ipa": "/ɪmˈpɔːrtnt/",
    "ar": "مهم",
    "type": "adjective",
    "synonyms": ["crucial", "significant", "essential"],
    "antonyms": ["unimportant", "insignificant"],
    "sentences": [
      { "en": "It is important to learn English.", "ar": "من المهم تعلم الإنجليزية." },
      { "en": "She has an important meeting today.", "ar": "لديها اجتماع مهم اليوم." }
    ],
    "level": "a2"
  },
  {
    "word": "succeed",
    "ipa": "/səkˈsiːd/",
    "ar": "ينجح",
    "type": "verb",
    "synonyms": ["achieve", "accomplish", "triumph"],
    "antonyms": ["fail", "lose"],
    "sentences": [
      { "en": "If you work hard, you will succeed.", "ar": "إذا عملت بجد، سوف تنجح." },
      { "en": "She succeeded in passing the exam.", "ar": "نجحت في اجتياز الامتحان." }
    ],
    "level": "b1"
  },
  {
    "word": "experience",
    "ipa": "/ɪkˈspɪriəns/",
    "ar": "تجربة / خبرة",
    "type": "noun",
    "synonyms": ["background", "knowledge", "skill"],
    "antonyms": ["inexperience", "ignorance"],
    "sentences": [
      { "en": "Do you have any experience in sales?", "ar": "هل لديك أي خبرة في المبيعات؟" },
      { "en": "Traveling is a great experience.", "ar": "السفر تجربة رائعة." }
    ],
    "level": "a2"
  },
  {
    "word": "challenge",
    "ipa": "/ˈtʃælɪndʒ/",
    "ar": "تحدي / يتحدى",
    "type": "noun/verb",
    "synonyms": ["test", "problem", "dare"],
    "antonyms": ["agreement", "solution"],
    "sentences": [
      { "en": "Learning a new language is a big challenge.", "ar": "تعلم لغة جديدة يمثل تحدياً كبيراً." },
      { "en": "I challenge you to a game of chess.", "ar": "أتحداك في لعبة شطرنج." }
    ],
    "level": "b1"
  },
  {
    "word": "opportunity",
    "ipa": "/ˌɑːpərˈtuːnəti/",
    "ar": "فرصة",
    "type": "noun",
    "synonyms": ["chance", "occasion", "moment"],
    "antonyms": ["disadvantage", "obstacle"],
    "sentences": [
      { "en": "This is a great opportunity for you.", "ar": "هذه فرصة عظيمة لك." },
      { "en": "Don't miss this opportunity.", "ar": "لا تفوت هذه الفرصة." }
    ],
    "level": "b1"
  },
  {
    "word": "knowledge",
    "ipa": "/ˈnɑːlɪdʒ/",
    "ar": "معرفة",
    "type": "noun",
    "synonyms": ["understanding", "wisdom", "information"],
    "antonyms": ["ignorance", "unawareness"],
    "sentences": [
      { "en": "Knowledge is power.", "ar": "المعرفة قوة." },
      { "en": "He has a lot of knowledge about history.", "ar": "لديه الكثير من المعرفة حول التاريخ." }
    ],
    "level": "a2"
  },
  {
    "word": "improve",
    "ipa": "/ɪmˈpruːv/",
    "ar": "يتحسن / يحسن",
    "type": "verb",
    "synonyms": ["better", "upgrade", "enhance"],
    "antonyms": ["worsen", "decline", "deteriorate"],
    "sentences": [
      { "en": "I want to improve my English.", "ar": "أريد أن أحسن لغتي الإنجليزية." },
      { "en": "Her health is improving day by day.", "ar": "صحتها تتحسن يوماً بعد يوم." }
    ],
    "level": "a2"
  },
  {
    "word": "confidence",
    "ipa": "/ˈkɑːnfɪdəns/",
    "ar": "ثقة",
    "type": "noun",
    "synonyms": ["trust", "belief", "certainty"],
    "antonyms": ["doubt", "uncertainty"],
    "sentences": [
      { "en": "You need to have confidence in yourself.", "ar": "عليك أن تثق بنفسك." },
      { "en": "He answered the question with confidence.", "ar": "أجاب على السؤال بثقة." }
    ],
    "level": "b2"
  }
];

const data = {
  "dictionary": dictionary
};

fs.writeFileSync('public/dictionary.json', JSON.stringify(data, null, 2));
