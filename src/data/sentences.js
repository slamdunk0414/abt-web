/** 15 个示例视频（来自本地 src/videos，5 句 × 3 段） */
export const VIDEO_URLS = [
  new URL("../videos/It's up to you 1.mp4", import.meta.url).href,
  new URL("../videos/It's up to you 2.mp4", import.meta.url).href,
  new URL("../videos/It's up to you 3.mp4", import.meta.url).href,
  new URL("../videos/do me a favor 1.mp4", import.meta.url).href,
  new URL("../videos/do me a favor 2.mp4", import.meta.url).href,
  new URL("../videos/do me a favor 3.mp4", import.meta.url).href,
  new URL("../videos/i mean it 1.mp4", import.meta.url).href,
  new URL("../videos/i mean it 2.mp4", import.meta.url).href,
  new URL("../videos/i mean it 3.mp4", import.meta.url).href,
  new URL("../videos/so far so good 1.mov", import.meta.url).href,
  new URL("../videos/so far so good 2.mov", import.meta.url).href,
  new URL("../videos/so far so good 3.mov", import.meta.url).href,
  new URL("../videos/that's really something 1.mov", import.meta.url).href,
  new URL("../videos/that's really something 2.mov", import.meta.url).href,
  new URL("../videos/that's really something 3.mov", import.meta.url).href,
];

/**
 * tokens：整句分词；blankIndexes：被挖空的 token 下标（用户从词块里填回）
 */
export const SENTENCES = [
  {
    id: 1,
    en: "It's up to you.",
    zh: '由你决定。',
    tokens: ["It's", 'up', 'to', 'you.'],
    blankIndexes: [1, 2, 3],
  },
  {
    id: 2,
    en: 'Do me a favor.',
    zh: '帮我个忙。',
    tokens: ['Do', 'me', 'a', 'favor.'],
    blankIndexes: [0, 2, 3],
  },
  {
    id: 3,
    en: 'I mean it.',
    zh: '我是认真的。',
    tokens: ['I', 'mean', 'it.'],
    blankIndexes: [1, 2],
  },
  {
    id: 4,
    en: 'So far, so good.',
    zh: '到目前为止，一切都好。',
    tokens: ['So', 'far,', 'so', 'good.'],
    blankIndexes: [1, 2, 3],
  },
  {
    id: 5,
    en: "That's really something.",
    zh: '这也太厉害了吧。',
    tokens: ["That's", 'really', 'something.'],
    blankIndexes: [0, 1, 2],
  },
].map((s, idx) => {
  const base = idx * 3;
  return {
    ...s,
    videoUrls: VIDEO_URLS.slice(base, base + 3),
  };
});
