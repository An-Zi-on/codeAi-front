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
  const queryParams: Record<string, string> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams[key] = String(value)
    }
  })
  
  const queryString = new URLSearchParams(queryParams).toString()

  // 构建完整 URL
  let fullUrl: string
  if (url.startsWith('http')) {
    // 如果已经是完整 URL，直接使用并添加查询参数
    fullUrl = queryString ? `${url}?${queryString}` : url
  } else {
    // 如果不是完整 URL，添加 baseURL 和查询参数
    const baseURL = 'http://localhost:8102/api'
    fullUrl = queryString ? `${baseURL}${url}?${queryString}` : `${baseURL}${url}`
  }

  // 调试日志
  console.log('SSE URL:', fullUrl)
  console.log('SSE Params:', queryParams)

  // 创建 EventSource 实例
  // 注意：EventSource 不支持自定义超时，但可以通过心跳检测和重连机制来处理
  const eventSource = new EventSource(fullUrl, {
    withCredentials: true,
  })
  
  // 添加连接保活机制：定期检查连接状态
  let lastMessageTime = Date.now()
  const keepAliveInterval = setInterval(() => {
    const now = Date.now()
    // 如果超过5分钟没有收到消息，且连接状态不是OPEN，可能已断开
    if (now - lastMessageTime > 5 * 60 * 1000 && eventSource.readyState !== EventSource.OPEN) {
      console.warn('SSE连接可能已断开，readyState:', eventSource.readyState)
      clearInterval(keepAliveInterval)
    }
  }, 30000) // 每30秒检查一次
  
  // 在连接关闭时清理定时器
  const originalClose = eventSource.close.bind(eventSource)
  eventSource.close = () => {
    clearInterval(keepAliveInterval)
    originalClose()
  }

  // 处理消息
  eventSource.onmessage = (event) => {
    try {
      // 更新最后消息时间，用于连接保活检测
      lastMessageTime = Date.now()
      
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

  // 处理自定义事件（如 done 事件）
  eventSource.addEventListener('done', (event: any) => {
    console.log('SSE done 事件触发')
    options.onComplete?.()
  })

  // 监听所有自定义事件，包括可能的完成事件
  eventSource.addEventListener('complete', (event: any) => {
    console.log('SSE complete 事件触发')
    options.onComplete?.()
  })

  // 处理错误
  eventSource.onerror = (error) => {
    console.error('SSE error:', error, 'readyState:', eventSource.readyState)
    options.onError?.(error)
    // 如果连接关闭，调用完成回调
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('SSE 连接已关闭，触发完成回调')
      // 延迟一点确保所有消息都已处理
      setTimeout(() => {
        options.onComplete?.()
      }, 100)
    }
  }
  
  // 监听连接关闭事件
  eventSource.addEventListener('close', () => {
    console.log('SSE close 事件触发')
    setTimeout(() => {
      options.onComplete?.()
    }, 100)
  })

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

