// @ts-ignore
/* eslint-disable */
import request from '../request.ts'

/** 此处后端没有提供注释 POST /chat/history/admin/list/page/vo */
export async function listAllChatHistoryByPageForAdmin(
  body: API.ChatHistoryQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageChatHistory>('/chat/history/admin/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chat/history/message */
export async function saveMessage(
  body: API.ChatHistoryMessageSaveRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/chat/history/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** 此处后端没有提供注释 POST /chat/history/page */
export async function pageByApp(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.pageByAppParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageChatHistoryVO>('/chat/history/page', {
    method: 'POST',
    params: {
      ...params,
      httpServletRequest: undefined,
      ...params['httpServletRequest'],
    },
    ...(options || {}),
  })
}
