<template>
  <a-layout-footer class="global-footer">
    <div class="footer-content">
      <div class="footer-text">
        代码生成平台
        <a href="https://www.codefather.cn" target="_blank" rel="noopener noreferrer">
          AnZI
        </a>
      </div>
      <div class="footer-links">
        <a
          href="https://github.com/An-Zi-on"
          target="_blank"
          rel="noopener noreferrer"
          class="github-link"
          title="GitHub"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            width="18"
            height="18"
            class="github-icon"
          >
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  </a-layout-footer>
</template>

<script setup lang="ts">
// 页脚组件，无需额外逻辑
</script>

<style scoped>
.global-footer {
  background: linear-gradient(180deg, rgba(249, 250, 255, 0.95) 0%, rgba(233, 236, 246, 0.98) 95%);
  backdrop-filter: blur(18px);
  padding: 12px clamp(20px, 4vw, 48px);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 -24px 45px rgba(15, 23, 42, 0.08);
  height: var(--layout-footer-height, 72px);
  min-height: var(--layout-footer-height, 72px);
  max-height: var(--layout-footer-height, 72px);
  z-index: 1000;
  display: flex;
  align-items: center;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  color: rgba(28, 36, 55, 0.78);
  font-size: 13px;
  line-height: 1.4;
}

.footer-text {
  flex-shrink: 0;
  font-weight: 400;
  letter-spacing: 0.2px;
}

.footer-text a {
  color: #1890ff;
  text-decoration: none;
  margin-left: 6px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  padding: 2px 0;
}

.footer-text a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(to right, #1890ff, #40a9ff);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.footer-text a:hover {
  color: #40a9ff;
}

.footer-text a:hover::after {
  width: 100%;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  margin-left: auto;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(0, 0, 0, 0.75);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  background: transparent;
}

.github-link:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.08);
  transform: translateY(-1px);
}

.github-link:active {
  transform: translateY(0);
}

.github-icon {
  vertical-align: middle;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.github-link:hover .github-icon {
  transform: scale(1.1) rotate(5deg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .global-footer {
    padding: 12px 20px;
  }

  .footer-content {
    flex-direction: row;
    gap: 10px;
    font-size: 12px;
  }

  .footer-text {
    flex-shrink: 0;
  }

  .footer-links {
    margin-left: auto;
  }

  .github-link {
    padding: 4px 12px;
  }
}

@media (max-width: 480px) {
  .global-footer {
    padding: 10px 16px;
  }

  .footer-content {
    font-size: 11px;
    gap: 8px;
  }
}
</style>

