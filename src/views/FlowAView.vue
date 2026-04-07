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
    <swiper class="swiper" :allow-touch-move="false" @swiper="onSwiper">
      <swiper-slide v-for="s in sentences" :key="s.id" class="slide">
        <SentenceWorkspace :sentence="s" include-video @done="onSentenceDone" />
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import SentenceWorkspace from '../components/SentenceWorkspace.vue';
import { SENTENCES } from '../data/sentences.js';
import 'swiper/css';

const sentences = SENTENCES;
const router = useRouter();

/** @type {import('vue').Ref<any>} */
const swiperRef = ref(null);

function onSwiper(s) {
  swiperRef.value = s;
}

function onSentenceDone() {
  const s = swiperRef.value;
  if (!s) return;
  if (s.activeIndex >= sentences.length - 1) {
    router.push({ name: 'summary', query: { flow: 'a' } });
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
  overflow: hidden;
  box-sizing: border-box;
}
</style>
