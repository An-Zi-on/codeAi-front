/**
 * SSE (Server-Sent Events) 工具函数
 * 用于处理流式接口响应
 */

export interface SSEMessage {
  data: string
  event?: string
  id?: string
}

export interface SSEOptions {
  onMessage?: (message: SSEMessage) => void
  onError?: (error: Event) => void
  onComplete?: () => void
}

/**
 * 创建 SSE 连接
 * @param url 请求 URL
 * @param params 请求参数
 * @param options SSE 选项
 * @returns EventSource 实例
 */
export function createSSEConnection(
  url: string,
  params: Record<string, any>,
  options: SSEOptions = {}
): EventSource {
  // 构建查询字符串
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  ).toString()

  // 如果 URL 不是完整路径，添加 baseURL
  const baseURL = 'http://localhost:8102/api'
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}${queryString ? `?${queryString}` : ''}`

  // 创建 EventSource 实例
  const eventSource = new EventSource(fullUrl, {
    withCredentials: true,
  })

  // 处理消息
  eventSource.onmessage = (event) => {
    try {
      const message: SSEMessage = {
        data: event.data,
        event: event.type,
        id: event.lastEventId,
      }
      options.onMessage?.(message)
    } catch (error) {
      console.error('SSE message parse error:', error)
    }
  }

  // 处理错误
  eventSource.onerror = (error) => {
    console.error('SSE error:', error)
    options.onError?.(error)
    // 如果连接关闭，调用完成回调
    if (eventSource.readyState === EventSource.CLOSED) {
      options.onComplete?.()
    }
  }

  // 处理打开事件
  eventSource.onopen = () => {
    console.log('SSE connection opened')
  }

  return eventSource
}

/**
 * 关闭 SSE 连接
 * @param eventSource EventSource 实例
 */
export function closeSSEConnection(eventSource: EventSource | null) {
  if (eventSource) {
    eventSource.close()
  }
}

