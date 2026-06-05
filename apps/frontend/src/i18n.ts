// Malayalam + English message catalog for next-intl

const messages = {
  ml: {
    nav: {
      projects: "പ്രകല്പനങ്ങൾ",
      query: "ചോദ്യം",
      dashboard: "ഡാഷ്‌ബോർഡ്",
      settings: "ക്രമീകരണങ്ങൾ",
      logout: "പുറത്തുകടക്കുക",
    },
    landing: {
      headline: "സ്ക്രീൻപ്ലേ AI",
      subheadline: "മലയാള സിനിമ ക്രൂ-വിനായി",
      description:
        "തിരക്കഥ അപ്‌ലോഡ് ചെയ്യൂ — മലയാളത്തിൽ ചോദ്യം ചോദിക്കൂ — കൃത്യമായ ഉദ്ധരണികൾ നേടൂ",
      cta: "ആരംഭിക്കുക",
    },
    query: {
      placeholder: "നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക...",
      submit: "തിരയൽ",
      suggestions: "നിർദ്ദേശിത ചോദ്യങ്ങൾ",
      history: "ചോദ്യ ചരിത്രം",
      bookmark: "ബുക്ക്‌മാർക്ക്",
      language: "ഭാഷ",
    },
    roles: {
      actor: "നടൻ",
      director: "സംവിധായകൻ",
      cinematographer: "ഛായാഗ്രാഹകൻ",
      editor: "എഡിറ്റർ",
      music: "സംഗീതം",
      producer: "നിർമ്മാതാവ്",
      viewer: "കാഴ്ചക്കാരൻ",
    },
    emotions: {
      love: "പ്രണയം",
      sadness: "സങ്കടം",
      sacrifice: "ത്യാഗം",
      separation: "വിയോഗം",
      conflict: "സംഘർഷം",
      joy: "സന്തോഷം",
      hope: "പ്രതീക്ഷ",
    },
    upload: {
      title: "തിരക്കഥ അപ്‌ലോഡ് ചെയ്യുക",
      drag: "PDF, DOCX, TXT ഫയൽ ഇവിടെ ഇടൂ",
      or: "അല്ലെങ്കിൽ",
      browse: "ഫൈൽ തിരഞ്ഞെടുക്കൂ",
      uploading: "അപ്‌ലോഡ് ചെയ്യുന്നു...",
      indexing: "ഇൻഡക്സ് ചെയ്യുന്നു...",
      ready: "തയ്യാർ!",
    },
    citation: {
      scene: "രംഗം",
      page: "പേജ്",
      characters: "കഥാപാത്രങ്ങൾ",
    },
  },
  en: {
    nav: {
      projects: "Projects",
      query: "Query",
      dashboard: "Dashboard",
      settings: "Settings",
      logout: "Logout",
    },
    landing: {
      headline: "Screenplay AI",
      subheadline: "For Malayalam Film Crews",
      description:
        "Upload a screenplay — query in Malayalam or English — get exact scene citations",
      cta: "Get Started",
    },
    query: {
      placeholder: "Type your question in Malayalam or English...",
      submit: "Search",
      suggestions: "Suggested Questions",
      history: "Query History",
      bookmark: "Bookmark",
      language: "Language",
    },
    roles: {
      actor: "Actor",
      director: "Director",
      cinematographer: "Cinematographer",
      editor: "Editor",
      music: "Music",
      producer: "Producer",
      viewer: "Viewer",
    },
    emotions: {
      love: "Love",
      sadness: "Sadness",
      sacrifice: "Sacrifice",
      separation: "Separation",
      conflict: "Conflict",
      joy: "Joy",
      hope: "Hope",
    },
    upload: {
      title: "Upload Screenplay",
      drag: "Drop PDF, DOCX, or TXT here",
      or: "or",
      browse: "Browse files",
      uploading: "Uploading...",
      indexing: "Indexing scenes...",
      ready: "Ready!",
    },
    citation: {
      scene: "Scene",
      page: "Page",
      characters: "Characters",
    },
  },
};

export default messages;
export type Messages = typeof messages.en;
