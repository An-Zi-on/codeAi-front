/**
 * Axios 请求封装模块
 *
 * 功能说明：
 * - 创建统一的 Axios 实例
 * - 配置基础请求地址、超时时间、携带凭证等
 * - 添加全局请求/响应拦截器
 * - 处理通用业务逻辑（如未登录跳转）
 */

import axios from 'axios';
import { message } from 'ant-design-vue';

// ==============================
// 1. 创建 Axios 实例
// ==============================
const myAxios = axios.create({
  //请求基础路径
  baseURL: 'http://localhost:8102/api',
  // 超时时间
  timeout: 60000,
  // 允许跨域请求时携带 Cookie（用于后端识别用户会话）
  withCredentials: true,
});

// 2. 全局请求拦截器
myAxios.interceptors.request.use(
  /**
   * 请求成功发送前的处理
   * @param {Object} config - 当前请求的配置对象
   * @returns {Object} 修改后的配置（必须返回）
   */
  function (config) {
    // TODO: 可在此处添加 Token、Loading 等逻辑
    // 例如：从 localStorage 获取 token 并注入 headers
    // config.headers.Authorization = `Bearer ${getToken()}`;
    return config;
  },
  /**
   * 请求发生错误时的处理（如网络中断）
   * @param {Error} error - 请求错误对象
   * @returns {Promise<never>} 抛出错误，交由调用方 catch
   */
  function (error) {
    return Promise.reject(error);
  },
);

// ==============================
// 3. 全局响应拦截器
// ==============================
myAxios.interceptors.response.use(
  /**
   * 响应成功（状态码 2xx）时的处理
   * @param {Object} response - 响应对象
   * @returns {Object} 原始响应（或可返回 response.data 以简化调用）
   */
  function (response) {
    const { data } = response;
    if (data.code === 40100) {
      // 40100 表示“未登录”或“会话过期”
      // 判断当前请求是否为“获取登录用户信息”接口
      // 如果是，则不跳转（避免死循环）
      const isGetLoginUserRequest = response.request.responseURL.includes('user/get/login');

      // 判断当前页面是否已经是登录页
      const isAlreadyOnLoginPage = window.location.pathname.includes('/user/login');

      // 仅在“非用户信息请求”且“不在登录页”时跳转
      if (!isGetLoginUserRequest && !isAlreadyOnLoginPage) {
        message.warning('请先登录');
        // 跳转到登录页，并携带当前页面作为 redirect 参数，登录后可返回
        window.location.href = `/user/login?redirect=${encodeURIComponent(window.location.href)}`;
      }
    }

    // 默认直接返回完整响应（也可根据项目规范返回 data）
    return response;
  },
  /**
   * 响应失败（状态码非 2xx）或网络错误时的处理
   * @param {Error} error - 响应错误对象（包含 response、request、message 等）
   * @returns {Promise<never>} 抛出错误，交由调用方处理
   */
  function (error) {
    // TODO: 可在此统一处理错误提示（如 500、404、网络异常等）
    // 例如：message.error('服务器开小差了，请稍后再试~');

    // 将错误继续抛出，让具体调用处决定如何处理
    return Promise.reject(error);
  },
);

export default myAxios;
