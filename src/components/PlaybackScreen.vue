<template>
  <div class="playback">
    <div class="playback-bg" aria-hidden="true" />

    <header v-if="showNavBar" class="playback-nav">
      <button type="button" class="nav-icon" aria-label="返回" @click="$emit('back')">
        <svg class="nav-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14.5 6.5L9 12l5.5 5.5"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="nav-title" />
      <div class="nav-right">
        <button type="button" class="nav-icon" aria-label="分享" @click="$emit('share')">
          <svg class="nav-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 4v10M8 7l4-3 4 3M6 16h12a2 2 0 002-2v-1"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button type="button" class="nav-icon" aria-label="更多" @click="$emit('more')">
          <span class="dot-col">
            <span class="dot" />
            <span class="dot" />
            <span class="dot" />
          </span>
        </button>
      </div>
    </header>

    <div class="playback-main" :class="{ 'playback-main--with-nav': showNavBar }">
      <div class="playback-video-shell">
        <span v-if="segmentBadge" class="segment-badge">{{ segmentBadge }}</span>
        <div class="playback-video-frame" @click="onVideoAreaClick">
          <video
            ref="videoRef"
            class="playback-video"
            :src="videoSrc"
            playsinline
            preload="metadata"
            @play="playing = true"
            @pause="playing = false"
            @click.stop
          />
          <button
            v-show="!playing"
            type="button"
            class="playback-play"
            aria-label="播放"
            @click.stop="togglePlay"
          >
            <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="22" cy="22" r="22" fill="rgba(0,0,0,0.45)" />
              <path d="M18 14L32 22L18 30V14Z" fill="rgba(255,255,255,0.92)" />
            </svg>
          </button>
        </div>
      </div>

      <div class="playback-quote">
        <div class="quote-line" />
        <div class="quote-row">
          <span class="quote-mark">“</span>
          <div class="quote-texts">
            <p class="quote-en">{{ titleEn }}</p>
            <p class="quote-zh">{{ titleZh }}</p>
          </div>
        </div>
      </div>

      <div v-if="primaryLabel" class="cta-wrap">
        <button type="button" class="cta-btn" @click="$emit('primary')">
          {{ primaryLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineEmits(['back', 'share', 'more', 'primary']);

const props = defineProps({
  videoSrc: {
    type: String,
    required: true,
  },
  titleEn: {
    type: String,
    required: true,
  },
  titleZh: {
    type: String,
    required: true,
  },
  /** 例如「示例 1 / 3」 */
  segmentBadge: {
    type: String,
    default: '',
  },
  showNavBar: {
    type: Boolean,
    default: true,
  },
  primaryLabel: {
    type: String,
    default: '',
  },
});

const videoRef = ref(null);
const playing = ref(false);

function togglePlay() {
  const v = videoRef.value;
  if (!v) return;
  if (v.paused) void v.play();
  else v.pause();
}

function onVideoAreaClick() {
  togglePlay();
}
</script>

<style scoped>
.playback {
  position: relative;
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
  overflow: hidden;
}

.playback-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(120, 160, 255, 0.25), transparent 55%),
    radial-gradient(90% 60% at 100% 30%, rgba(180, 120, 255, 0.12), transparent 50%),
    linear-gradient(180deg, #07080c 0%, #0b0d12 45%, #07080c 100%);
  filter: saturate(1.05);
  pointer-events: none;
}

.playback-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.playback-nav {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 4px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  width: 100%;
  box-sizing: border-box;
}

.nav-title {
  flex: 1;
  height: 28px;
}

.nav-right {
  display: flex;
  gap: 8px;
}

.nav-icon {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
}

.nav-svg {
  width: 24px;
  height: 24px;
}

.dot-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
}

.playback-main {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  /* 顶部留白：避开浮层返回键，并贴近设计稿视频垂直位置 */
  padding: calc(52px + env(safe-area-inset-top, 0px)) 0 calc(16px + env(safe-area-inset-bottom, 0px));
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.playback-main--with-nav {
  padding-top: 12px;
}

.playback-video-shell {
  position: relative;
  flex-shrink: 0;
  width: 100%;
}

.segment-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
}

.playback-video-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 0;
  overflow: hidden;
  border: none;
  box-shadow: none;
  background: #000;
}

.playback-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playback-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35));
}

.playback-quote {
  margin-top: 18px;
  position: relative;
  flex-shrink: 0;
  padding-left: 16px;
  padding-right: 16px;
}

.quote-line {
  height: 1px;
  width: 100%;
  margin-bottom: 10px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0));
  opacity: 0.55;
}

.quote-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.quote-mark {
  font-family: 'Aldrich', system-ui, sans-serif;
  font-size: 40px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.3);
  margin-top: -6px;
  flex-shrink: 0;
}

.quote-texts {
  flex: 1;
  min-width: 0;
}

.quote-en {
  margin: 0;
  font-family: 'Poppins', system-ui, sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.35;
  letter-spacing: 0.01em;
  color: #ffffff;
}

.quote-zh {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}

.cta-wrap {
  flex-shrink: 0;
  padding: 14px 16px 0;
  box-sizing: border-box;
}

.cta-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  background: linear-gradient(180deg, #5ed0ff, #3aa7e6);
  color: #0b0c0f;
  box-shadow: 0 12px 28px rgba(62, 180, 255, 0.25);
}
</style>
