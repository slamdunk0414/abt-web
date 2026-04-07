<template>
  <div class="flow">
    <button
      type="button"
      class="flow-back"
      aria-label="返回"
      @click="$router.push('/')"
    >
      <svg class="flow-back-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14.5 6.5L9 12l5.5 5.5"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <swiper
      v-if="phase === 'watch'"
      key="watch"
      class="swiper"
      direction="vertical"
      :modules="modules"
      :allow-touch-move="true"
      :mousewheel="{ releaseOnEdges: true, sensitivity: 1, thresholdDelta: 10 }"
      @swiper="onWatchSwiper"
    >
      <swiper-slide v-for="item in watchItems" :key="`w-${item.id}-${item.videoIndex}`" class="slide slide--watch">
        <div class="watch-panel watch-panel--playback">
          <PlaybackScreen
            :video-src="item.videoUrls?.[item.videoIndex - 1] || item.videoUrl"
            :title-en="item.en"
            :title-zh="item.zh"
            :segment-badge="`${item.videoIndex} / 3`"
            :show-nav-bar="false"
            :primary-label="isLastWatchSlide(item) ? '进入练习模式' : ''"
            @primary="enterPractice"
          />
        </div>
      </swiper-slide>
    </swiper>

    <swiper
      v-else
      key="practice"
      class="swiper"
      direction="vertical"
      :modules="modules"
      :allow-touch-move="false"
      :mousewheel="false"
      @swiper="onPracticeSwiper"
    >
      <swiper-slide v-for="s in sentences" :key="'p-' + s.id" class="slide slide--practice">
        <SentenceWorkspace :sentence="s" :include-video="false" @done="onPracticeDone" />
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup>
import { Mousewheel } from 'swiper';
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import SentenceWorkspace from '../components/SentenceWorkspace.vue';
import PlaybackScreen from '../components/PlaybackScreen.vue';
import { SENTENCES } from '../data/sentences.js';
import 'swiper/css';

const modules = [Mousewheel];
const sentences = SENTENCES;
const watchItems = SENTENCES.flatMap((s) => [1, 2, 3].map((i) => ({ ...s, videoIndex: i })));
const router = useRouter();

const phase = ref('watch');
/** @type {import('vue').Ref<any>} */
const watchSwiper = ref(null);
/** @type {import('vue').Ref<any>} */
const practiceSwiper = ref(null);

function onWatchSwiper(s) {
  watchSwiper.value = s;
}

function onPracticeSwiper(s) {
  practiceSwiper.value = s;
}

function isLastWatchSlide(item) {
  const last = watchItems[watchItems.length - 1];
  return item.id === last.id && item.videoIndex === last.videoIndex;
}

function enterPractice() {
  phase.value = 'practice';
  practiceIndex.value = 0;
}

function onPracticeDone() {
  const s = practiceSwiper.value;
  if (!s) return;
  if (s.activeIndex >= sentences.length - 1) {
    router.push({ name: 'summary', query: { flow: 'b' } });
    return;
  }
  s.slideNext();
}
</script>

<style scoped>
.flow {
  position: relative;
  height: 100dvh;
  max-height: 100dvh;
  background: #0c0d10;
  overflow: hidden;
}

.flow-back {
  position: absolute;
  top: calc(10px + env(safe-area-inset-top, 0px));
  left: 10px;
  z-index: 50;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.92);
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.flow-back-svg {
  width: 24px;
  height: 24px;
}

.swiper {
  height: 100%;
  width: 100%;
}

.slide {
  height: 100%;
  box-sizing: border-box;
}

.slide--watch {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.slide--practice {
  overflow: hidden;
}

.watch-panel {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 28px;
  width: 100%;
  box-sizing: border-box;
}

.watch-panel--playback {
  padding: 0;
  gap: 0;
  min-height: 100%;
}

</style>
