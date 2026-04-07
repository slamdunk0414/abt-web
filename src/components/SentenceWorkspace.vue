<template>
  <div class="workspace">
    <swiper
      class="step-swiper"
      direction="vertical"
      :nested="true"
      :modules="modules"
      :allow-touch-move="true"
      :threshold="8"
      :touch-start-prevent-default="false"
      :prevent-clicks="false"
      :prevent-clicks-propagation="false"
      :mousewheel="{ releaseOnEdges: true, sensitivity: 1, thresholdDelta: 10 }"
      @swiper="onStepSwiper"
      @slideChange="onSlideChange"
    >
      <swiper-slide
        v-for="stepName in stepSequence"
        :key="stepName"
        class="step-slide"
      >
        <!-- video x3：三个独立页面（对齐 Figma「播放详情页」） -->
        <section v-if="stepName.startsWith('video-')" class="panel panel--playback">
          <PlaybackScreen
            :video-src="videoSrcForStep(stepName)"
            :title-en="sentence.en"
            :title-zh="sentence.zh"
            :segment-badge="`示例 ${stepName === 'video-1' ? 1 : stepName === 'video-2' ? 2 : 3} / 3`"
            :show-nav-bar="false"
          />
        </section>

        <!-- exercise：对齐 Figma 10812:22597（视频+引号下划线+词块+底部检查） -->
        <section
          v-else-if="stepName === 'exercise'"
          class="panel panel--exercise"
          :class="{ 'panel--exercise--result': exercisePhase === 'result' }"
        >
          <div class="exercise-bg" aria-hidden="true" />

          <div class="exercise-inner">
            <div class="exercise-video-shell">
              <div class="exercise-video-frame" @click="toggleExerciseVideo">
                <video
                  ref="exerciseVideoRef"
                  class="exercise-video"
                  :src="exerciseVideoSrc"
                  playsinline
                  preload="metadata"
                  @play="exerciseVideoPlaying = true"
                  @pause="exerciseVideoPlaying = false"
                  @click.stop
                />
                <button
                  v-show="!exerciseVideoPlaying"
                  type="button"
                  class="exercise-play"
                  aria-label="播放"
                  @click.stop="toggleExerciseVideo"
                >
                  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="22" cy="22" r="22" fill="rgba(0,0,0,0.45)" />
                    <path d="M18 14L32 22L18 30V14Z" fill="rgba(255,255,255,0.92)" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="exercise-quote" :class="{ 'exercise-quote--muted': exercisePhase === 'result' }">
              <div class="exercise-quote-line" />
              <div class="exercise-quote-row">
                <span class="exercise-quote-mark">“</span>
                <div class="sentence-build">
                  <template v-for="(tok, idx) in sentence.tokens" :key="idx">
                    <span v-if="!isBlank(idx)" class="sb-word">{{ tok }}</span>
                    <button
                      v-else-if="exercisePhase === 'input'"
                      type="button"
                      class="sb-slot"
                      :class="{ 'sb-slot--filled': !!slotValue(blankSlotIndex(idx)) }"
                      @click="clearSlot(blankSlotIndex(idx))"
                    >
                      <span class="sb-slot-text">{{ slotValue(blankSlotIndex(idx)) || '\u00a0' }}</span>
                      <span class="sb-slot-line" aria-hidden="true" />
                    </button>
                    <span v-else class="sb-slot sb-slot--static sb-slot--filled">
                      <span class="sb-slot-text">{{ tok }}</span>
                      <span class="sb-slot-line" aria-hidden="true" />
                    </span>
                  </template>
                </div>
              </div>
              <p class="exercise-quote-zh">{{ sentence.zh }}</p>
            </div>

            <div class="exercise-flex-grow" />

            <template v-if="exercisePhase === 'input'">
              <div class="chips chips--bank">
                <button
                  v-for="(w, i) in bank"
                  :key="`${w}-${i}`"
                  type="button"
                  class="chip chip--bank"
                  @click="pickChip(w)"
                >
                  {{ w }}
                </button>
              </div>
              <button
                type="button"
                class="exercise-check"
                :disabled="!exerciseReady"
                @click="submitExercise"
              >
                检查
              </button>
            </template>
          </div>

          <template v-if="exercisePhase === 'result'">
            <div class="verify-scrim" aria-hidden="true" />
            <div class="verify-sheet" :class="'verify-sheet--' + exerciseStatus.kindClass">
              <div class="verify-sheet-bg" aria-hidden="true" />
              <div class="verify-sheet-body" @click.stop="goRecord">
                <template v-if="exerciseOk === true">
                  <div class="verify-row">
                    <span class="verify-icon verify-icon--ok" aria-hidden="true">
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 5.2L4.8 9 13 1"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span class="verify-title verify-title--ok">答对了！</span>
                  </div>
                </template>
                <template v-else-if="exerciseOk === false">
                  <div class="verify-row">
                    <span class="verify-icon verify-icon--bad" aria-hidden="true">×</span>
                    <span class="verify-title verify-title--bad">不正确</span>
                  </div>
                  <p class="verify-line verify-line--emph">{{ wrongFillPreview }}</p>
                  <p class="verify-label">正确答案：</p>
                  <p class="verify-line">{{ sentence.en }}</p>
                </template>
                <template v-else>
                  <p class="verify-title verify-title--skip">本题已跳过</p>
                  <p class="verify-hint">未填完也可继续跟读练习</p>
                </template>
              </div>
              <button
                type="button"
                class="verify-cta swiper-no-swiping"
                :class="'verify-cta--' + exerciseStatus.kindClass"
                @click.stop="goRecord"
              >
                {{ exerciseStatus.btnLabel }}
              </button>
            </div>
          </template>
        </section>

        <!-- record：对齐 Figma 10679:39092 / 10679:39379（Listenleap 播放详情页·录音） -->
        <section v-else-if="stepName === 'record'" class="panel record-screen">
          <div class="record-bg" aria-hidden="true" />
          <div class="record-inner">
            <div class="record-video-shell">
              <div class="record-video-frame" @click="toggleRecordPreviewVideo">
                <video
                  ref="recordVideoRef"
                  class="record-video"
                  :src="exerciseVideoSrc"
                  playsinline
                  preload="metadata"
                  @play="recordVideoPlaying = true"
                  @pause="recordVideoPlaying = false"
                  @click.stop
                />
                <button
                  v-show="!recordVideoPlaying && recordPhase === 'idle'"
                  type="button"
                  class="record-play"
                  aria-label="播放"
                  @click.stop="toggleRecordPreviewVideo"
                >
                  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="22" cy="22" r="22" fill="rgba(0,0,0,0.45)" />
                    <path d="M18 14L32 22L18 30V14Z" fill="rgba(255,255,255,0.92)" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="record-quote">
              <div class="record-quote-line" />
              <div class="record-quote-row">
                <span class="record-quote-mark">“</span>
                <div class="record-quote-texts">
                  <p class="record-quote-en">{{ sentence.en }}</p>
                  <p class="record-quote-zh">{{ sentence.zh }}</p>
                </div>
              </div>
            </div>

            <div class="record-flex-grow" />

            <!-- 正在录音：mock 波形 + 计时 -->
            <div v-if="recordPhase === 'recording'" class="record-live">
              <p class="record-live-label">正在录音</p>
              <div class="record-wave" aria-hidden="true">
                <span
                  v-for="n in 24"
                  :key="n"
                  class="record-wave-bar"
                  :style="{ animationDelay: `${n * 0.04}s`, height: `${18 + (n % 5) * 8}px` }"
                />
              </div>
              <div class="record-live-meta">
                <span class="record-timer">{{ recordTimerDisplay }}</span>
                <div class="record-live-bar">
                  <div class="record-live-fill" :style="{ width: recProgress + '%' }" />
                </div>
              </div>
            </div>

            <p v-if="recordPhase === 'evaluating'" class="record-eval">正在测评…</p>

            <div class="record-dock">
              <div class="record-dock-row">
                <button type="button" class="record-icon-btn" aria-label="重听原音" @click="noopReplay">
                  <svg class="record-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11 5L6 9H3v6h3l5 4V5z"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M15.5 8.5c1.33 1.33 1.33 6.67 0 8"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                    <path
                      d="M18 6c2.5 2.5 2.5 11.5 0 14"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>

                <div class="record-mic-wrap">
                  <button
                    type="button"
                    class="record-mic"
                    :class="{
                      'record-mic--pulse': recordPhase === 'recording',
                      'record-mic--disabled': recordPhase !== 'idle',
                    }"
                    :disabled="recordPhase !== 'idle'"
                    aria-label="长按录音"
                    @pointerdown="onRecordMicPointerDown"
                    @pointerup="onRecordMicPointerUp"
                    @pointerleave="onRecordMicPointerUp"
                    @pointercancel="onRecordMicPointerUp"
                  >
                    <svg class="record-mic-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="12" y="6" width="8" height="13" rx="4" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M8 14v2a8 8 0 0016 0v-2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <path d="M16 25v3M12 28h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  class="record-icon-btn"
                  :class="{ 'record-icon-btn--muted': !hasMockRecording }"
                  aria-label="回放录音"
                  :disabled="!hasMockRecording"
                  @click="noopReplayUser"
                >
                  <svg class="record-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
                  </svg>
                </button>
              </div>
              <p v-if="recordPhase === 'idle'" class="record-dock-hint">长按录音</p>
            </div>

            <div v-if="recordPhase === 'result'" class="rrfb-sheet">
              <div class="rrfb-sheet-bg" aria-hidden="true" />
              <div class="rrfb-sheet-inner">
                <div class="rrfb-feedback" :class="'rrfb-feedback--' + recFeedback.kind">
                  <template v-if="recFeedback.kind === 'great'">
                    <span class="rrfb-fb-ico rrfb-fb-ico--ok" aria-hidden="true">
                      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 7l5 5L17 1"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <p class="rrfb-fb-line rrfb-fb-line--single">{{ recFeedback.title }}</p>
                  </template>
                  <template v-else-if="recFeedback.kind === 'almost'">
                    <span class="rrfb-fb-ico rrfb-fb-ico--warn" aria-hidden="true">i</span>
                    <div class="rrfb-fb-lines">
                      <p class="rrfb-fb-line">{{ recFeedback.title }}</p>
                      <p class="rrfb-fb-line rrfb-fb-line--sub">{{ recFeedback.sub }}</p>
                    </div>
                  </template>
                  <template v-else>
                    <span class="rrfb-fb-ico rrfb-fb-ico--bad" aria-hidden="true">×</span>
                    <div class="rrfb-fb-lines">
                      <p class="rrfb-fb-line">{{ recFeedback.title }}</p>
                      <p class="rrfb-fb-line rrfb-fb-line--sub">{{ recFeedback.sub }}</p>
                    </div>
                  </template>
                </div>
                <button
                  type="button"
                  class="rrfb-cta swiper-no-swiping"
                  :class="'rrfb-cta--' + recResultPage"
                  @click.stop="finish"
                >
                  {{ recResultCtaLabel }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 录制结果：Listenleap 稿（歌单卡 + 引号句 + 底栏反馈） -->
        <section v-else-if="stepName === 'recordFeedback'" class="panel rrfb" :class="'rrfb--' + recResultPage">
          <div class="rrfb-page-bg" aria-hidden="true" />

          <div class="rrfb-scroll">
            <div class="rrfb-card">
              <p class="rrfb-mix-title">TOP CHiLL MiX</p>
              <div class="rrfb-mix-grid">
                <ul class="rrfb-tracks rrfb-tracks--left">
                  <li>Feelings</li>
                  <li>On My Mind</li>
                  <li>10000 hours</li>
                  <li>Sunday</li>
                </ul>
                <div class="rrfb-cover" @click="toggleResultPreviewVideo">
                  <video
                    ref="resultVideoRef"
                    class="rrfb-cover-vid"
                    :src="exerciseVideoSrc"
                    playsinline
                    preload="metadata"
                    @play="resultVideoPlaying = true"
                    @pause="resultVideoPlaying = false"
                    @click.stop
                  />
                  <button
                    v-show="!resultVideoPlaying"
                    type="button"
                    class="rrfb-cover-play"
                    aria-label="播放"
                    @click.stop="toggleResultPreviewVideo"
                  >
                    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="22" cy="22" r="22" fill="rgba(0,0,0,0.45)" />
                      <path d="M18 14L32 22L18 30V14Z" fill="rgba(255,255,255,0.92)" />
                    </svg>
                  </button>
                </div>
                <ul class="rrfb-tracks rrfb-tracks--right">
                  <li>Golden</li>
                  <li>Easy</li>
                  <li>Night drive</li>
                  <li>Coastline</li>
                </ul>
              </div>
            </div>

            <div class="rrfb-quote">
              <div class="rrfb-quote-line" />
              <div class="rrfb-quote-row">
                <span class="rrfb-quote-mark">“</span>
                <div class="rrfb-quote-texts">
                  <p class="rrfb-quote-en">{{ sentence.en }}</p>
                  <p class="rrfb-quote-zh">{{ sentence.zh }}</p>
                </div>
              </div>
            </div>

            <div class="rrfb-inline-icons" aria-hidden="true">
              <span class="rrfb-head-ico">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 4a3 3 0 013 3v1h1a2 2 0 012 2v5a2 2 0 01-2 2h-1.2"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <path d="M8 17v1a2 2 0 002 2h4a2 2 0 002-2v-1" stroke="currentColor" stroke-width="1.5" />
                  <path
                    d="M5 12c0-1.5.5-2.5 1.5-3M19 12c0-1.5-.5-2.5-1.5-3"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <span class="rrfb-state-ico" :class="'rrfb-state-ico--' + recFeedback.kind">
                <svg v-if="recFeedback.kind === 'great'" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
                  <path d="M5.5 10l2.5 2.5L14.5 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
                <template v-else-if="recFeedback.kind === 'almost'">
                  <span class="rrfb-state-letter">i</span>
                </template>
                <span v-else class="rrfb-state-letter">!</span>
              </span>
            </div>
          </div>

          <div class="rrfb-sheet">
            <div class="rrfb-sheet-bg" aria-hidden="true" />
            <div class="rrfb-sheet-inner">
              <div class="rrfb-feedback" :class="'rrfb-feedback--' + recFeedback.kind">
                <template v-if="recFeedback.kind === 'great'">
                  <span class="rrfb-fb-ico rrfb-fb-ico--ok" aria-hidden="true">
                    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 7l5 5L17 1"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  <p class="rrfb-fb-line rrfb-fb-line--single">{{ recFeedback.title }}</p>
                </template>
                <template v-else-if="recFeedback.kind === 'almost'">
                  <span class="rrfb-fb-ico rrfb-fb-ico--warn" aria-hidden="true">i</span>
                  <div class="rrfb-fb-lines">
                    <p class="rrfb-fb-line">{{ recFeedback.title }}</p>
                    <p class="rrfb-fb-line rrfb-fb-line--sub">{{ recFeedback.sub }}</p>
                  </div>
                </template>
                <template v-else>
                  <span class="rrfb-fb-ico rrfb-fb-ico--bad" aria-hidden="true">×</span>
                  <div class="rrfb-fb-lines">
                    <p class="rrfb-fb-line">{{ recFeedback.title }}</p>
                    <p class="rrfb-fb-line rrfb-fb-line--sub">{{ recFeedback.sub }}</p>
                  </div>
                </template>
              </div>
              <button
                type="button"
                class="rrfb-cta swiper-no-swiping"
                :class="'rrfb-cta--' + recResultPage"
                @click.stop="finish"
              >
                {{ recResultCtaLabel }}
              </button>
            </div>
          </div>
        </section>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup>
import { Mousewheel } from 'swiper';
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import PlaybackScreen from './PlaybackScreen.vue';
import 'swiper/css';

const modules = [Mousewheel];

const props = defineProps({
  sentence: {
    type: Object,
    required: true,
  },
  includeVideo: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['done']);

const stepSequence = computed(() =>
  props.includeVideo
    ? ['video-1', 'video-2', 'video-3', 'exercise', 'record']
    : ['exercise', 'record'],
);

function stepToIndex(stepName) {
  const i = stepSequence.value.indexOf(stepName);
  return i < 0 ? 0 : i;
}

function indexToStep(index) {
  return stepSequence.value[index] ?? stepSequence.value[0];
}

const step = ref(props.includeVideo ? 'video-1' : 'exercise');

function videoSrcForStep(stepName) {
  const i = stepName === 'video-1' ? 0 : stepName === 'video-2' ? 1 : 2;
  const urls = props.sentence.videoUrls;
  if (Array.isArray(urls) && urls[i]) return urls[i];
  // 兼容：如果历史数据仍只有 videoUrl
  return props.sentence.videoUrl;
}

/** 练习页顶部预览：与稿一致用当前句第 1 段视频 */
const exerciseVideoSrc = computed(() => {
  const urls = props.sentence.videoUrls;
  if (Array.isArray(urls) && urls[0]) return urls[0];
  return props.sentence.videoUrl ?? '';
});

const exerciseVideoRef = ref(null);
const exerciseVideoPlaying = ref(false);

function toggleExerciseVideo() {
  const v = exerciseVideoRef.value;
  if (!v) return;
  if (v.paused) void v.play();
  else v.pause();
}

function pauseExerciseVideo() {
  const v = exerciseVideoRef.value;
  if (!v) return;
  v.pause();
  exerciseVideoPlaying.value = false;
}

const recordVideoRef = ref(null);
const recordVideoPlaying = ref(false);

function toggleRecordPreviewVideo() {
  const v = recordVideoRef.value;
  if (!v) return;
  if (v.paused) void v.play();
  else v.pause();
}

function pauseRecordVideo() {
  const v = recordVideoRef.value;
  if (!v) return;
  v.pause();
  recordVideoPlaying.value = false;
}

const resultVideoRef = ref(null);
const resultVideoPlaying = ref(false);

function toggleResultPreviewVideo() {
  const v = resultVideoRef.value;
  if (!v) return;
  if (v.paused) void v.play();
  else v.pause();
}

function pauseResultVideo() {
  const v = resultVideoRef.value;
  if (!v) return;
  v.pause();
  resultVideoPlaying.value = false;
}

/** @type {import('swiper').Swiper | null} */
let stepSwiper = null;
let ignoreSlideChange = false;

function clearIgnoreSoon(ms = 120) {
  window.setTimeout(() => {
    ignoreSlideChange = false;
  }, ms);
}

/** @param {number} speed 切换动画时长（ms），0 为立即切换 */
function syncSwiperToStep(speed = 0) {
  if (!stepSwiper) return;
  const target = stepToIndex(step.value);
  if (stepSwiper.activeIndex === target) return;
  ignoreSlideChange = true;
  stepSwiper.slideTo(target, speed);
  clearIgnoreSoon(speed > 0 ? speed + 120 : 120);
}

function onStepSwiper(s) {
  stepSwiper = s;
  ignoreSlideChange = true;
  void nextTick(() => {
    if (!stepSwiper) return;
    stepSwiper.slideTo(stepToIndex(step.value), 0);
    clearIgnoreSoon();
  });
}

watch(step, (v, prev) => {
  if (v !== 'exercise') pauseExerciseVideo();
  if (v !== 'record') pauseRecordVideo();
  if (v !== 'recordFeedback') pauseResultVideo();
  const speed = prev === 'exercise' && v === 'record' ? 400 : 0;
  void nextTick(() => syncSwiperToStep(speed));
});

watch(
  () => props.sentence.id,
  async () => {
    cancelRecordAnim();
    step.value = props.includeVideo ? 'video-1' : 'exercise';
    resetExercise();
    exerciseOk.value = null;
    exercisePhase.value = 'input';
    exerciseVideoPlaying.value = false;
    recordPhase.value = 'idle';
    recProgress.value = 0;
    recordedOnce.value = false;
    recordVideoPlaying.value = false;
    recFeedback.value = { kind: 'great', title: '', sub: '' };
    if (stepSwiper) {
      void nextTick(() => syncSwiperToStep(0));
    }
    await nextTick();
    const v = exerciseVideoRef.value;
    if (v) {
      v.currentTime = 0;
      v.pause();
    }
    const rv = recordVideoRef.value;
    if (rv) {
      rv.currentTime = 0;
      rv.pause();
    }
    const resV = resultVideoRef.value;
    if (resV) {
      resV.currentTime = 0;
      resV.pause();
    }
    resultVideoPlaying.value = false;
  },
);

/**
 * 使用 slideChange（而非 transitionEnd），避免与 watch(step) 的 slideTo 竞态导致步骤与幻灯片错位、出现「循环回检查页」。
 */
function onSlideChange(swiper) {
  if (ignoreSlideChange || !stepSwiper) return;

  const idx = swiper.activeIndex;
  const expected = stepToIndex(step.value);
  if (idx === expected) return;

  const cur = step.value;
  const curIdx = expected;

  if (idx > curIdx) {
    const targetStep = indexToStep(idx);

    // video-1/2/3 之间允许自由滑动（这是「三个视频页面」的分页行为）
    if (cur.startsWith('video-') && targetStep.startsWith('video-')) {
      step.value = targetStep;
      return;
    }

    // 第三个视频滑到练习
    if (cur.startsWith('video-') && targetStep === 'exercise') {
      goExercise();
      return;
    }
    // 练习 → 跟读：须先在同页出结果；上滑在「填写」时等同检查或跳过
    if (cur === 'exercise' && targetStep === 'record') {
      if (exercisePhase.value === 'input') {
        if (exerciseReady.value) submitExercise();
        else {
          exerciseOk.value = null;
          exercisePhase.value = 'result';
        }
        ignoreSlideChange = true;
        stepSwiper.slideTo(curIdx, 0);
        clearIgnoreSoon();
        return;
      }
      goRecord();
      return;
    }
    
    ignoreSlideChange = true;
    stepSwiper.slideTo(curIdx, 0);
    clearIgnoreSoon();
    return;
  }

  const newStep = indexToStep(idx);

  if (cur === 'exercise' && newStep.startsWith('video')) {
    exercisePhase.value = 'input';
    exerciseOk.value = null;
    resetExercise();
  }

  if (cur === 'record' && newStep === 'exercise') {
    cancelRecordAnim();
    recordPhase.value = 'idle';
    recProgress.value = 0;
    exercisePhase.value = 'input';
    resetExercise();
    exerciseOk.value = null;
  }

  step.value = newStep;
}

const blankSet = computed(() => new Set(props.sentence.blankIndexes));
const orderedBlankIndexes = computed(() => [...props.sentence.blankIndexes].sort((a, b) => a - b));

function isBlank(tokenIndex) {
  return blankSet.value.has(tokenIndex);
}

function blankSlotIndex(tokenIndex) {
  return orderedBlankIndexes.value.indexOf(tokenIndex);
}

/** @type {import('vue').Ref<(string|null)[]>} */
const placed = ref([]);

/** @type {import('vue').Ref<string[]>} */
const bank = ref([]);

function resetExercise() {
  const blanks = orderedBlankIndexes.value.map((i) => props.sentence.tokens[i]);
  placed.value = blanks.map(() => null);
  bank.value = shuffle([...blanks]);
}

resetExercise();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function slotValue(slotIdx) {
  return placed.value[slotIdx] ?? null;
}

function pickChip(word) {
  const i = placed.value.findIndex((x) => x === null);
  if (i === -1) return;
  const idx = bank.value.indexOf(word);
  if (idx === -1) return;
  const nextBank = [...bank.value];
  const nextPlaced = [...placed.value];
  nextBank.splice(idx, 1);
  nextPlaced[i] = word;
  bank.value = nextBank;
  placed.value = nextPlaced;
}

function clearSlot(slotIdx) {
  const w = placed.value[slotIdx];
  if (!w) return;
  const nextBank = [...bank.value];
  const nextPlaced = [...placed.value];
  nextPlaced[slotIdx] = null;
  nextBank.push(w);
  bank.value = nextBank;
  placed.value = nextPlaced;
}

const exerciseReady = computed(() => placed.value.every((x) => x !== null));

/** 用户填入后的整句预览（错误反馈用，对齐 Figma 错句展示） */
const wrongFillPreview = computed(() => {
  const parts = props.sentence.tokens.map((tok, idx) => {
    if (!blankSet.value.has(idx)) return tok;
    const si = orderedBlankIndexes.value.indexOf(idx);
    return placed.value[si] ?? '____';
  });
  return parts.join(' ');
});

/** @type {import('vue').Ref<boolean|null>} */
const exerciseOk = ref(null);

/** 练习：填写阶段 | 同页展示结果 */
/** @type {import('vue').Ref<'input'|'result'>} */
const exercisePhase = ref('input');

const exerciseStatus = computed(() => {
  if (exerciseOk.value === true) return { kindClass: 'ok', btnLabel: '继续' };
  if (exerciseOk.value === false) return { kindClass: 'bad', btnLabel: '知道了' };
  return { kindClass: 'skip', btnLabel: '继续' };
});

function submitExercise() {
  if (step.value !== 'exercise' || exercisePhase.value !== 'input') return;
  const ok = orderedBlankIndexes.value.every((ti, si) => props.sentence.tokens[ti] === placed.value[si]);
  exerciseOk.value = ok;
  exercisePhase.value = 'result';
}

function goExercise() {
  resetExercise();
  exerciseOk.value = null;
  exercisePhase.value = 'input';
  step.value = 'exercise';
}

function goRecord() {
  if (step.value !== 'exercise' || exercisePhase.value !== 'result') return;
  cancelRecordAnim();
  recordPhase.value = 'idle';
  recProgress.value = 0;
  recordedOnce.value = false;
  step.value = 'record';

  // 强制切换到录音页，避免在「综合练习」外层 Swiper 参与手势时，
  // watch(step) 与 slideChange 的时序竞态导致按钮点了但不翻页。
  if (stepSwiper) {
    ignoreSlideChange = true;
    stepSwiper.slideTo(stepToIndex('record'), 400);
    clearIgnoreSoon(520);
  }
}

/** @type {import('vue').Ref<'idle'|'recording'|'evaluating'|'result'>} */
const recordPhase = ref('idle');
const recProgress = ref(0);
const recordedOnce = ref(false);

/** @type {import('vue').Ref<{ kind: string; title: string; sub: string }>} */
const recFeedback = ref({ kind: 'great', title: '', sub: '' });

const recordTimerDisplay = computed(() => {
  const totalSec = 1.2;
  const t = (recProgress.value / 100) * totalSec;
  const s = Math.floor(t);
  const cs = Math.floor((t - s) * 100);
  return `${String(s).padStart(2, '0')}:${String(cs).padStart(2, '0')}`;
});

const recResultPage = computed(() => {
  const k = recFeedback.value.kind;
  if (k === 'great') return '1';
  if (k === 'almost') return '2';
  return '3';
});

const hasMockRecording = computed(() => recordedOnce.value);

const recResultCtaLabel = computed(() => (recFeedback.value.kind === 'bad' ? '知道了' : '继续'));

/** @type {number} */
let recTimer = 0;
/** @type {ReturnType<typeof setTimeout> | 0} */
let evalTimer = 0;

function cancelRecordAnim() {
  if (recTimer) cancelAnimationFrame(recTimer);
  if (evalTimer) clearTimeout(evalTimer);
  recTimer = 0;
  evalTimer = 0;
}

/** @type {ReturnType<typeof setTimeout> | 0} */
let recordMicHoldTimer = 0;

function onRecordMicPointerDown(e) {
  if (recordPhase.value !== 'idle') return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  recordMicHoldTimer = window.setTimeout(() => {
    recordMicHoldTimer = 0;
    startMockRecord();
  }, 420);
}

function onRecordMicPointerUp() {
  if (recordMicHoldTimer) {
    clearTimeout(recordMicHoldTimer);
    recordMicHoldTimer = 0;
  }
}

onUnmounted(() => {
  cancelRecordAnim();
  if (recordMicHoldTimer) clearTimeout(recordMicHoldTimer);
});

function startMockRecord() {
  cancelRecordAnim();
  recordPhase.value = 'recording';
  recProgress.value = 0;
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min(100, ((t - start) / 1200) * 100);
    recProgress.value = p;
    if (p < 100) {
      recTimer = requestAnimationFrame(tick);
    } else {
      recordedOnce.value = true;
      recordPhase.value = 'evaluating';
      evalTimer = window.setTimeout(() => {
        const r = Math.random();
        if (r < 0.42) {
          recFeedback.value = { kind: 'great', title: '你的发音真地道！', sub: '' };
        } else if (r < 0.78) {
          recFeedback.value = {
            kind: 'almost',
            title: '呃~ 听起来不太对哦~',
            sub: '再试下，多练练就好啦！',
          };
        } else {
          recFeedback.value = { kind: 'bad', title: '不太对哦~', sub: '不要紧，我们继续前进' };
        }
        recordPhase.value = 'result';
      }, 900);
    }
  };
  recTimer = requestAnimationFrame(tick);
}

function noopReplay() {
  /* 演示：无真实音频 */
}

function noopReplayUser() {
  /* 演示 */
}

function finish() {
  emit('done');
}

</script>

<style scoped>
.workspace {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 0 0 12px;
  box-sizing: border-box;
}

.step-swiper {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.step-slide {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
}

.panel--playback {
  padding: 0 !important;
  gap: 0 !important;
  overflow: hidden;
  background: transparent;
}

.panel {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 16px 20px;
  box-sizing: border-box;
}

.video-wrap {
  border-radius: 14px;
  overflow: hidden;
  background: #15171c;
  border: 1px solid #232733;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #000;
}

.video-tag {
  margin: 6px 0 0;
  font-size: 0.78rem;
  color: #8b95a5;
}

.en-line {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
  color: #f1f3f5;
}

.zh-line {
  margin: 0;
  color: #9aa3b2;
  font-size: 0.95rem;
}

.panel.panel--exercise {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 !important;
  gap: 0 !important;
  overflow: hidden;
  color: #fff;
}

.panel--exercise--result {
  overflow: hidden;
}

.exercise-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(120, 160, 255, 0.25), transparent 55%),
    radial-gradient(90% 60% at 100% 30%, rgba(180, 120, 255, 0.12), transparent 50%),
    linear-gradient(180deg, #07080c 0%, #0b0d12 45%, #07080c 100%);
  filter: saturate(1.05);
  pointer-events: none;
}

.exercise-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.exercise-inner {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 375px;
  margin: 0 auto;
  padding: calc(52px + env(safe-area-inset-top, 0px)) 18px calc(20px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.exercise-video-shell {
  width: 100%;
  max-width: 338px;
  margin: 0 auto;
  flex-shrink: 0;
}

.exercise-video-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  overflow: hidden;
  background: #000;
  border: 1.5px solid rgba(94, 170, 255, 0.55);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  box-sizing: border-box;
}

.exercise-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.exercise-play {
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

.exercise-quote {
  margin-top: 20px;
  flex-shrink: 0;
}

.exercise-quote--muted {
  opacity: 0.5;
  pointer-events: none;
}

.exercise-quote-line {
  height: 1px;
  width: 100%;
  max-width: 338px;
  margin-bottom: 10px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.85),
    rgba(255, 255, 255, 0)
  );
  opacity: 0.55;
}

.exercise-quote-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
}

.exercise-quote-mark {
  font-family: 'Aldrich', system-ui, sans-serif;
  font-size: 40px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.3);
  margin-top: -4px;
  flex-shrink: 0;
}

.sentence-build {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 10px;
}

.sb-word {
  font-family: 'Poppins', 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.5;
  color: #ffffff;
}

.sb-slot {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
  margin: 0 2px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  vertical-align: bottom;
}

.sb-slot--static {
  cursor: default;
}

.sb-slot-text {
  display: block;
  min-height: 1.5em;
  font-family: 'Poppins', 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.5;
  color: #ffffff;
  opacity: 0.28;
  text-align: center;
}

.sb-slot--filled .sb-slot-text {
  opacity: 1;
}

.sb-slot-line {
  display: block;
  width: 100%;
  min-width: 36px;
  height: 3px;
  margin-top: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.88);
}

.exercise-quote-zh {
  margin: 12px 0 0;
  padding-left: 36px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.58);
}

.exercise-flex-grow {
  flex: 1 1 auto;
  min-height: 28px;
}

.chip {
  border: none;
  font: inherit;
}

.chip:active {
  transform: scale(0.98);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 14px;
  justify-content: flex-start;
  flex-shrink: 0;
}

.chip--bank {
  box-sizing: border-box;
  min-height: 38px;
  padding: 6px 18px;
  border-radius: 24px;
  border: 1.2px solid rgba(255, 255, 255, 0.78);
  background: rgba(12, 14, 22, 0.72);
  color: #ffffff;
  font-family: 'Poppins', 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.5;
  cursor: pointer;
}

.chip--bank:focus-visible {
  outline: 2px solid rgba(115, 115, 252, 0.7);
  outline-offset: 2px;
}

.exercise-check {
  width: 100%;
  max-width: 338px;
  margin: 18px auto 0;
  height: 56px;
  border: none;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-family: 'PingFang SC', 'Poppins', system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.5;
  cursor: pointer;
  flex-shrink: 0;
}

.exercise-check:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.verify-scrim {
  position: absolute;
  inset: 0;
  z-index: 4;
  background: rgba(0, 0, 0, 0.28);
  pointer-events: none;
}

.verify-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

.verify-sheet-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 0;
  pointer-events: none;
}

.verify-sheet-body {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 375px;
  padding: 20px 32px 16px;
  box-sizing: border-box;
}

.verify-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.verify-icon--ok {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #04d187;
  color: #ffffff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.verify-icon--bad {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff5a5a;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.verify-title {
  margin: 0;
  font-family: 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.5;
}

.verify-title--ok {
  color: #04d187;
}

.verify-title--bad {
  color: #ff5a5a;
}

.verify-title--skip {
  color: #ffffff;
  text-align: center;
  width: 100%;
}

.verify-label {
  margin: 16px 0 0;
  font-family: 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.5;
  color: #ffffff;
}

.verify-line {
  margin: 6px 0 0;
  font-family: 'PingFang SC', 'Poppins', system-ui, sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.5;
  color: #ffffff;
}

.verify-line--emph {
  margin-top: 12px;
}

.verify-hint {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.62);
  text-align: center;
}

.verify-cta {
  position: relative;
  z-index: 1;
  width: calc(100% - 36px);
  max-width: 338px;
  height: 56px;
  margin: 8px 18px 0;
  border: none;
  border-radius: 100px;
  font-family: 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.5;
  color: #ffffff;
  cursor: pointer;
  touch-action: manipulation;
}

.verify-cta--ok {
  background: #04d187;
}

.verify-cta--bad {
  background: #ff5a5a;
}

.verify-cta--skip {
  background: rgba(255, 255, 255, 0.22);
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 14px 18px;
  font-weight: 600;
}

.btn.full {
  width: 100%;
  margin-top: auto;
}

.btn.primary {
  background: linear-gradient(180deg, #47c2ff, #2f8fd6);
  color: #0b0c0f;
}

.btn.primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn.success {
  background: linear-gradient(180deg, #5ee6a8, #38c77a);
  color: #0b0c0f;
}

.btn.danger {
  background: linear-gradient(180deg, #ff7a72, #e04d4d);
  color: #fff;
}

/* —— 录音页 Figma 10679:39092 / 正在录音 10679:39379 —— */
.record-screen.panel {
  position: relative;
  padding: 0 !important;
  gap: 0 !important;
  overflow: hidden;
  background: #07080c;
}

.record-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(120, 160, 255, 0.2), transparent 55%),
    radial-gradient(90% 60% at 100% 30%, rgba(255, 97, 131, 0.08), transparent 50%),
    linear-gradient(180deg, #07080c 0%, #0b0d12 50%, #07080c 100%);
  pointer-events: none;
}

.record-inner {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 375px;
  margin: 0 auto;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 18px calc(8px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.record-video-shell {
  width: 100%;
  max-width: 338px;
  margin: 0 auto;
  flex-shrink: 0;
}

.record-video-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  overflow: hidden;
  background: #000;
  border: 1.5px solid rgba(94, 170, 255, 0.45);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

.record-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-play {
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

.record-quote {
  margin-top: 20px;
  flex-shrink: 0;
}

.record-quote-line {
  height: 1px;
  width: 100%;
  max-width: 338px;
  margin-bottom: 10px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.85),
    rgba(255, 255, 255, 0)
  );
  opacity: 0.55;
}

.record-quote-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
}

.record-quote-mark {
  font-family: 'Aldrich', system-ui, sans-serif;
  font-size: 40px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.3);
  margin-top: -4px;
  flex-shrink: 0;
}

.record-quote-en {
  margin: 0;
  font-family: 'Poppins', 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 2.2;
  color: #ffffff;
}

.record-quote-zh {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}

.record-flex-grow {
  flex: 1 1 auto;
  min-height: 16px;
}

.record-live {
  text-align: center;
  margin-bottom: 8px;
}

.record-live-label {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #ff6183;
  letter-spacing: 0.02em;
}

.record-wave {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 48px;
  margin-bottom: 12px;
}

.record-wave-bar {
  width: 3px;
  min-height: 8px;
  border-radius: 2px;
  background: linear-gradient(180deg, #ff8ba3, #ff6183);
  animation: record-wave 0.45s ease-in-out infinite alternate;
}

@keyframes record-wave {
  from {
    transform: scaleY(0.35);
    opacity: 0.65;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

.record-live-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.record-timer {
  font-family: 'Poppins', ui-monospace, monospace;
  font-size: 22px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  font-variant-numeric: tabular-nums;
}

.record-live-bar {
  width: 100%;
  max-width: 220px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.record-live-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff6183, #5858f5);
  transition: width 0.05s linear;
}

.record-eval {
  text-align: center;
  margin: 8px 0 4px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.record-dock {
  flex-shrink: 0;
  width: calc(100% + 36px);
  max-width: 375px;
  margin-left: -18px;
  margin-right: -18px;
  min-height: 128px;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.record-dock-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 48px;
}

.record-icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 14, 22, 0.85);
  color: #9aa3b2;
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.record-icon-btn:active {
  transform: scale(0.97);
}

.record-icon-btn--muted {
  opacity: 0.38;
  cursor: not-allowed;
}

.record-icon-svg {
  width: 24px;
  height: 24px;
}

.record-mic-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.record-mic {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  background: rgba(12, 14, 22, 0.92);
  color: #9aa3b2;
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  touch-action: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    color 0.2s;
}

.record-mic:not(:disabled):hover {
  border-color: rgba(255, 97, 131, 0.55);
  color: #e8eaed;
}

.record-mic--pulse {
  border-color: rgba(255, 97, 131, 0.85);
  color: #ff6183;
  box-shadow: 0 0 0 0 rgba(255, 97, 131, 0.45);
  animation: record-mic-pulse 1s ease-out infinite;
}

@keyframes record-mic-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 97, 131, 0.45);
  }
  70% {
    box-shadow: 0 0 0 16px rgba(255, 97, 131, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 97, 131, 0);
  }
}

.record-mic--disabled:not(.record-mic--pulse) {
  opacity: 0.55;
  cursor: default;
}

.record-mic-svg {
  width: 30px;
  height: 30px;
}

.record-dock-hint {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.23;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
}

/* —— 录制结果 Listenleap：歌单卡 + 底栏 —— */
.rrfb.panel {
  position: relative;
  padding: 0 !important;
  gap: 0 !important;
  overflow: hidden;
  background: #0a1628;
  min-height: 0;
}

.rrfb-page-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, #152a45 0%, #0a1628 38%, #060d18 100%);
}

.rrfb--1 .rrfb-page-bg {
  box-shadow: inset 0 -120px 100px -80px rgba(4, 209, 135, 0.12);
}

.rrfb--2 .rrfb-page-bg {
  box-shadow: inset 0 -120px 100px -80px rgba(255, 176, 72, 0.1);
}

.rrfb--3 .rrfb-page-bg {
  box-shadow: inset 0 -120px 100px -80px rgba(255, 90, 90, 0.1);
}

.rrfb-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 16px 200px;
  max-width: 375px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.rrfb-card {
  background: linear-gradient(145deg, rgba(30, 58, 95, 0.95), rgba(12, 28, 52, 0.98));
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 12px 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
}

.rrfb-mix-title {
  margin: 0 0 12px;
  text-align: center;
  font-family: 'Aldrich', 'Brush Script MT', cursive, system-ui, sans-serif;
  font-size: 22px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.rrfb-mix-grid {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  gap: 8px;
}

.rrfb-tracks {
  margin: 0;
  padding: 0 4px;
  list-style: none;
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.45);
}

.rrfb-tracks--left {
  text-align: right;
}

.rrfb-tracks--right {
  text-align: left;
}

.rrfb-tracks li + li {
  margin-top: 2px;
}

.rrfb-cover {
  position: relative;
  width: 112px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #000;
  align-self: center;
  aspect-ratio: 1;
}

.rrfb-cover-vid {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rrfb-cover-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.rrfb-quote {
  margin-top: 22px;
}

.rrfb-quote-line {
  height: 1px;
  width: 100%;
  margin-bottom: 10px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.75),
    rgba(255, 255, 255, 0)
  );
  opacity: 0.5;
}

.rrfb-quote-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
}

.rrfb-quote-mark {
  font-family: 'Aldrich', system-ui, sans-serif;
  font-size: 36px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.28);
  margin-top: -4px;
  flex-shrink: 0;
}

.rrfb-quote-en {
  margin: 0;
  font-family: 'Poppins', 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 22px;
  line-height: 1.45;
  color: #ffffff;
}

.rrfb-quote-zh {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}

.rrfb-inline-icons {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
  padding-right: 4px;
}

.rrfb-head-ico {
  width: 26px;
  height: 26px;
  color: rgba(255, 255, 255, 0.55);
  display: grid;
  place-items: center;
}

.rrfb-head-ico svg {
  width: 22px;
  height: 22px;
}

.rrfb-state-ico {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.rrfb-state-ico svg {
  width: 14px;
  height: 14px;
}

.rrfb-state-ico--great {
  background: #04d187;
  color: #ffffff;
}

.rrfb-state-ico--almost {
  background: #f5a623;
  color: #ffffff;
}

.rrfb-state-ico--bad {
  background: #ff5a5a;
  color: #ffffff;
}

.rrfb-state-letter {
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.rrfb-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.rrfb-sheet-bg {
  position: absolute;
  inset: 0;
  background: rgba(6, 10, 18, 0.72);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-radius: 20px 20px 0 0;
}

.rrfb-sheet-inner {
  position: relative;
  z-index: 1;
  padding: 18px 20px 16px;
  max-width: 375px;
  margin: 0 auto;
  box-sizing: border-box;
}

.rrfb-feedback {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
  min-height: 44px;
}

.rrfb-fb-ico {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  margin-top: 2px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.rrfb-fb-ico--ok {
  background: rgba(4, 209, 135, 0.25);
  color: #04d187;
  border: 1px solid rgba(4, 209, 135, 0.55);
}

.rrfb-fb-ico--warn {
  background: rgba(245, 166, 35, 0.2);
  color: #f5a623;
  border: 1px solid rgba(245, 166, 35, 0.55);
  font-style: italic;
  font-family: Georgia, 'Times New Roman', serif;
}

.rrfb-fb-ico--bad {
  background: rgba(255, 90, 90, 0.2);
  color: #ff8a8a;
  border: 1px solid rgba(255, 90, 90, 0.5);
}

.rrfb-fb-line {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
}

.rrfb-feedback--great .rrfb-fb-line {
  color: #04d187;
}

.rrfb-feedback--almost .rrfb-fb-line {
  color: #f5a623;
}

.rrfb-feedback--bad .rrfb-fb-line {
  color: #ff8a8a;
}

.rrfb-fb-line--sub {
  margin-top: 4px !important;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.95;
}

.rrfb-fb-lines {
  flex: 1;
  min-width: 0;
}

.rrfb-cta {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 26px;
  font-family: 'PingFang SC', system-ui, sans-serif;
  font-weight: 600;
  font-size: 17px;
  cursor: pointer;
  touch-action: manipulation;
}

.rrfb-cta--1 {
  background: linear-gradient(180deg, #3ee6a8, #04d187);
  color: #0b0c0f;
}

.rrfb-cta--2 {
  background: linear-gradient(180deg, #ffc56a, #e89a2e);
  color: #ffffff;
}

.rrfb-cta--3 {
  background: linear-gradient(180deg, #ff8a82, #e04d4d);
  color: #ffffff;
}
</style>