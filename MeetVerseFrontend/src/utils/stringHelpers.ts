export const getAvatarGradient = (title: string) => {
  const gradients = [
    "from-indigo-500 to-violet-600",
    "from-rose-500 to-orange-500",
    "from-teal-400 to-cyan-500",
    "from-emerald-400 to-teal-500",
    "from-fuchsia-500 to-pink-500",
    "from-blue-500 to-indigo-500",
  ];
  if (!title) return gradients[0];
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
};

export const tailwindGradientMap: Record<string, string> = {
  "indigo-violet": "from-indigo-500 to-violet-600",
  "rose-orange": "from-rose-500 to-orange-500",
  "teal-cyan": "from-teal-400 to-cyan-500",
  "amber-yellow": "from-amber-400 to-yellow-500",
  "green-emerald": "from-green-400 to-emerald-500",
  "blue-sky": "from-blue-500 to-sky-400",
  "pink-fuchsia": "from-pink-500 to-fuchsia-500",
  "slate-gray": "from-slate-500 to-gray-600"
};

export const getGroupGradient = (title: string, coverGradient?: string | null) => {
  if (coverGradient && tailwindGradientMap[coverGradient]) {
    return tailwindGradientMap[coverGradient];
  }
  return getAvatarGradient(title);
};
