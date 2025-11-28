<template>
  <a-layout-footer class="global-footer">
    <div class="footer-content">
      编程导航原创项目 by
      <a href="https://www.codefather.cn" target="_blank" rel="noopener noreferrer">
        程序员鱼皮
      </a>
    </div>
  </a-layout-footer>
</template>

<script setup lang="ts">
// 页脚组件，无需额外逻辑
</script>

<style scoped>
.global-footer {
  text-align: center;
  background: #f0f2f5;
  padding: 16px 24px;
  position: relative;
  bottom: 0;
  width: 100%;
}

.footer-content {
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.footer-content a {
  color: #1890ff;
  text-decoration: none;
  margin-left: 4px;
}

.footer-content a:hover {
  text-decoration: underline;
}
</style>

