<template>
  <main class="home">
    <div class="hero">
      <h1 class="title">学习练习 · AB 流程试验</h1>
      <p class="subtitle">选择一种练习流，体验完整闭环（视频 → 填空 → 跟读模拟）。</p>
    </div>

    <div class="actions">
      <router-link class="card primary" to="/flow-a">
        <span class="card-kicker">流程 A</span>
        <span class="card-title">单句练习模式</span>
        <span class="card-desc">逐句完成：视频 → 练习 → 录音，再进入下一句。</span>
      </router-link>
      <router-link class="card secondary" to="/flow-b">
        <span class="card-kicker">流程 B</span>
        <span class="card-title">综合练习模式</span>
        <span class="card-desc">先连续看完 5 句视频，再统一进入练习与录音。</span>
      </router-link>
    </div>
  </main>
</template>

<script setup></script>

<style scoped>
.home {
  min-height: 100dvh;
  padding: 24px 18px 40px;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  font-size: 1.45rem;
  margin: 4px 0 0;
  letter-spacing: 0.02em;
}

.subtitle {
  margin: 0;
  color: #8b95a5;
  line-height: 1.55;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 18px 18px 20px;
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  border: 1px solid #2a3140;
  background: linear-gradient(165deg, #141820, #0f1117);
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: #3d4656;
}

.card.primary {
  border-color: rgba(71, 194, 255, 0.35);
}

.card.secondary {
  border-color: rgba(139, 92, 246, 0.35);
}

.card-kicker {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6f7a8f;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
}

.card-desc {
  font-size: 0.9rem;
  color: #9aa3b2;
  line-height: 1.5;
}
</style>
