<template>
  <main class="summary-root">
    <!-- 顶部返回 -->
    <button type="button" class="nav-back" aria-label="返回" @click="$router.push('/')">
      <svg class="nav-back-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14.5 6.5L9 12l5.5 5.5"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- 完成页：今日已学完 -->
    <section v-if="mode === 'done'" class="screen screen--done">
      <div class="confetti" aria-hidden="true">
        <span class="dot dot--1" />
        <span class="dot dot--2" />
        <span class="dot dot--3" />
        <span class="dot dot--4" />
      </div>
      <div class="avatar">
        <span class="avatar-emoji">🐧</span>
      </div>
      <h1 class="headline">今日已学完！</h1>
      <p class="caption">已学金句</p>
      <p class="count">{{ count }}</p>

      <button type="button" class="primary-cta" @click="mode = 'list'">继续浏览</button>
    </section>

    <!-- 金句汇总列表 -->
    <section v-else class="screen screen--list">
      <div class="confetti" aria-hidden="true">
        <span class="dot dot--1" />
        <span class="dot dot--2" />
        <span class="dot dot--3" />
        <span class="dot dot--4" />
      </div>
      <div class="avatar avatar--small">
        <span class="avatar-emoji">🐧</span>
      </div>
      <h1 class="headline headline--wow">Wow，太棒了！</h1>

      <section class="list-card">
        <header class="list-header">
          <h2 class="list-title">金句汇总</h2>
          <div class="list-line" />
        </header>
        <ul class="sentence-list">
          <li
            v-for="s in sentences"
            :key="s.id"
            class="sentence-item"
            :class="{ 'sentence-item--active': s.id === activeId }"
          >
            <p class="sentence-en">{{ s.en }}</p>
            <p class="sentence-meta">from YouTube: Ali Abdaal</p>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { SENTENCES } from '../data/sentences.js';

const route = useRoute();
const router = useRouter();

// 金句数量：当前 DEMO 固定 5
const count = SENTENCES.length;

// 完成页 / 汇总列表页
const mode = ref('done');

// 当前高亮的句子：默认第一句（与示例一致）
const activeId = Number(route.query.activeId ?? SENTENCES[0]?.id ?? 1);

const sentences = SENTENCES;
</script>

<style scoped>
.summary-root {
  position: relative;
  min-height: 100dvh;
  max-height: 100dvh;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 20px
    calc(20px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  background:
    radial-gradient(140% 120% at 50% -10%, rgba(80, 120, 200, 0.45), transparent 60%),
    linear-gradient(180deg, #05070c 0%, #090c14 45%, #05070c 100%);
  color: #f5f7fb;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.nav-back {
  position: absolute;
  left: 14px;
  top: calc(10px + env(safe-area-inset-top, 0px));
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  padding: 0;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.92);
  display: grid;
  place-items: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
}

.nav-back-svg {
  width: 22px;
  height: 22px;
}

.screen {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 72px;
}

.screen--list {
  padding-top: 80px;
}

.confetti {
  position: relative;
  width: 120px;
  height: 40px;
  margin-bottom: 4px;
}

.dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot--1 {
  left: 10px;
  top: 12px;
  background: #ff6183;
}

.dot--2 {
  right: 14px;
  top: 16px;
  background: #ffb048;
}

.dot--3 {
  left: 38px;
  top: 4px;
  background: #47c2ff;
}

.dot--4 {
  right: 36px;
  top: 0;
  background: #8b5cf6;
}

.avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 20%, #ffffff, #f3f5ff);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  margin-bottom: 18px;
}

.avatar--small {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.avatar-emoji {
  font-size: 36px;
}

.headline {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.headline--wow {
  font-size: 22px;
}

.caption {
  margin: 18px 0 4px;
  font-size: 14px;
  color: rgba(245, 247, 251, 0.7);
}

.count {
  margin: 0 0 32px;
  font-size: 40px;
  font-weight: 800;
  color: #ffffff;
}

.primary-cta {
  margin-top: auto;
  width: 100%;
  max-width: 340px;
  height: 52px;
  border-radius: 26px;
  border: none;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
}

.list-card {
  width: 100%;
  max-width: 360px;
  margin-top: 22px;
  padding: 16px 18px 14px;
  border-radius: 20px;
  background: rgba(5, 9, 18, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(245, 247, 251, 0.9);
}

.list-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.3),
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0)
  );
}

.sentence-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sentence-item {
  padding: 10px 10px;
  border-radius: 14px;
  margin-bottom: 4px;
}

.sentence-item--active {
  background: rgba(255, 255, 255, 0.08);
}

.sentence-en {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.sentence-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(245, 247, 251, 0.6);
}

/* 美化 / 隐藏滚动条：只保留轻量细线条 */
.sentence-list::-webkit-scrollbar {
  width: 4px;
}

.sentence-list::-webkit-scrollbar-track {
  background: transparent;
}

.sentence-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
}

.sentence-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.32);
}

/* Firefox */
.sentence-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
}
</style>
