/**
 * ID 转换工具
 * 解决 JavaScript Number 精度丢失问题
 * 后端 Long 类型会序列化为字符串，前端需要统一处理
 */

/**
 * 将 ID 转换为字符串（用于发送到后端）
 * @param id ID 值（可能是 number 或 string）
 * @returns 字符串形式的 ID
 */
export function convertIdToString(id: number | string | undefined | null): string | undefined {
  if (id === undefined || id === null) {
    return undefined
  }
  return String(id)
}

/**
 * 将对象中的所有 ID 字段转换为字符串
 * @param obj 包含 ID 字段的对象
 * @returns 转换后的对象
 */
export function convertIdsToString<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj } as T
  
  // 需要转换的字段名
  const idFields = ['id', 'appId', 'userId']
  
  idFields.forEach((field) => {
    if (result[field] !== undefined && result[field] !== null) {
      // 如果后端返回的是字符串，保持字符串；如果是数字，转换为字符串
      ;(result as any)[field] = String(result[field])
    }
  })
  
  return result
}

/**
 * 从字符串解析 ID（用于从路由参数等获取）
 * @param id ID 字符串
 * @returns 数字形式的 ID（用于前端逻辑），如果无法解析则返回 0
 */
export function parseIdFromString(id: string | string[] | undefined): number {
  if (!id) return 0
  const idStr = Array.isArray(id) ? id[0] : id
  const numId = Number(idStr)
  return !isNaN(numId) && numId > 0 ? numId : 0
}

