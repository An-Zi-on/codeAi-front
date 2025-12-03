declare namespace API {
  type adminGetDetailParams = {
    id: number
  }

  type AppAdminPageRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    deployKey?: string
    priority?: number
    userId?: number
    isDelete?: number
  }

  type AppAdminUpdateRequest = {
    id?: number
    appName?: string
    cover?: string
    priority?: number
  }

  type AppCreateRequest = {
    initPrompt?: string
    codeGenType?: string
  }

  type AppDeployRequest = {
    appId?: number
  }

  type AppFeaturedPageRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    nameKeyword?: string
  }

  type AppMyPageRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    nameKeyword?: string
  }

  type AppUpdateMyRequest = {
    id?: number
    appName?: string
    cover?: string
  }

  type AppVO = {
    id?: number
    appName?: string
    cover?: string
    initPrompt?: string
    codeGenType?: string
    deployKey?: string
    deployedTime?: string
    priority?: number
    userId?: number
    editTime?: string
    createTime?: string
  }

  type AsyncContext = {
    request?: ServletRequest
    response?: ServletResponse
    timeout?: number
  }

  type BaseResponseAppVO = {
    code?: number
    data?: AppVO
    message?: string
  }

  type BaseResponseBoolean = {
    code?: number
    data?: boolean
    message?: string
  }

  type BaseResponseListUserVO = {
    code?: number
    data?: UserVO[]
    message?: string
  }

  type BaseResponseLocalDateTime = {
    code?: number
    data?: string
    message?: string
  }

  type BaseResponseLong = {
    code?: number
    data?: number
    message?: string
  }

  type BaseResponsePageAppVO = {
    code?: number
    data?: PageAppVO
    message?: string
  }

  type BaseResponsePageChatHistory = {
    code?: number
    data?: PageChatHistory
    message?: string
  }

  type BaseResponsePageChatHistoryVO = {
    code?: number
    data?: PageChatHistoryVO
    message?: string
  }

  type BaseResponsePageUserVO = {
    code?: number
    data?: PageUserVO
    message?: string
  }

  type BaseResponseString = {
    code?: number
    data?: string
    message?: string
  }

  type BaseResponseUserVO = {
    code?: number
    data?: UserVO
    message?: string
  }

  type ByIdRequest = {
    id?: number
  }

  type ChatHistory = {
    id?: number
    message?: string
    messageType?: string
    appId?: number
    userId?: number
    createTime?: string
    updateTime?: string
    isDelete?: number
  }

  type ChatHistoryMessageSaveRequest = {
    appId?: number
    message?: string
    messageType?: string
  }

  type ChatHistoryQueryRequest = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    id?: number
    message?: string
    messageType?: string
    appId?: number
    userId?: number
    lastCreateTime?: string
  }

  type ChatHistoryVO = {
    id?: number
    appId?: number
    userId?: number
    message?: string
    messageType?: string
    createTime?: string
  }

  type Cookie = {
    name?: string
    value?: string
    attributes?: Record<string, any>
    domain?: string
    maxAge?: number
    path?: string
    comment?: string
    version?: number
    httpOnly?: boolean
    secure?: boolean
  }

  type DeleteRequest = {
    id?: number
  }

  type FilterRegistration = {
    servletNameMappings?: string[]
    urlPatternMappings?: string[]
    name?: string
    className?: string
    initParameters?: Record<string, any>
  }

  type generateCodeParams = {
    appId: number
    message: string
  }

  type getMyAppParams = {
    id: number
  }

  type HttpServletMapping = {
    pattern?: string
    servletName?: string
    matchValue?: string
    mappingMatch?: 'CONTEXT_ROOT' | 'DEFAULT' | 'EXACT' | 'EXTENSION' | 'PATH'
  }

  type HttpServletRequest = {
    method?: string
    contextPath?: string
    requestedSessionIdFromCookie?: boolean
    requestedSessionIdFromURL?: boolean
    session?: HttpSession
    headerNames?: Record<string, any>
    remoteUser?: string
    userPrincipal?: { name?: string }
    authType?: string
    requestURI?: string
    trailerFields?: Record<string, any>
    requestURL?: { length?: number; empty?: boolean }
    servletPath?: string
    pathInfo?: string
    queryString?: string
    pathTranslated?: string
    cookies?: Cookie[]
    parts?: Part[]
    trailerFieldsReady?: boolean
    httpServletMapping?: HttpServletMapping
    requestedSessionIdValid?: boolean
    requestedSessionId?: string
    localName?: string
    localPort?: number
    contentType?: string
    scheme?: string
    inputStream?: ServletInputStream
    protocol?: string
    locale?: {
      language?: string
      displayName?: string
      country?: string
      variant?: string
      script?: string
      unicodeLocaleAttributes?: string[]
      unicodeLocaleKeys?: string[]
      displayLanguage?: string
      displayScript?: string
      displayCountry?: string
      displayVariant?: string
      extensionKeys?: string[]
      iso3Language?: string
      iso3Country?: string
    }
    contentLength?: number
    attributeNames?: Record<string, any>
    reader?: Record<string, any>
    contentLengthLong?: number
    servletContext?: ServletContext
    parameterNames?: Record<string, any>
    locales?: Record<string, any>
    secure?: boolean
    protocolRequestId?: string
    servletConnection?: ServletConnection
    characterEncoding?: string
    serverPort?: number
    remoteHost?: string
    remoteAddr?: string
    remotePort?: number
    asyncSupported?: boolean
    localAddr?: string
    dispatcherType?: 'FORWARD' | 'INCLUDE' | 'REQUEST' | 'ASYNC' | 'ERROR'
    asyncContext?: AsyncContext
    asyncStarted?: boolean
    serverName?: string
    parameterMap?: Record<string, any>
    requestId?: string
  }

  type HttpSession = {
    id?: string
    creationTime?: number
    attributeNames?: Record<string, any>
    servletContext?: ServletContext
    new?: boolean
    maxInactiveInterval?: number
    lastAccessedTime?: number
  }

  type JspConfigDescriptor = {
    taglibs?: TaglibDescriptor[]
    jspPropertyGroups?: JspPropertyGroupDescriptor[]
  }

  type JspPropertyGroupDescriptor = {
    buffer?: string
    defaultContentType?: string
    urlPatterns?: string[]
    includeCodas?: string[]
    pageEncoding?: string
    includePreludes?: string[]
    elIgnored?: string
    errorOnELNotFound?: string
    scriptingInvalid?: string
    errorOnUndeclaredNamespace?: string
    deferredSyntaxAllowedAsLiteral?: string
    trimDirectiveWhitespaces?: string
    isXml?: string
  }

  type PageAppVO = {
    records?: AppVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type pageByAppParams = {
    appId: number
    lastCreateTime: string
    pageSize: number
    httpServletRequest: HttpServletRequest
  }

  type PageChatHistory = {
    records?: ChatHistory[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageChatHistoryVO = {
    records?: ChatHistoryVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type pageParams = {
    page: PageUser
  }

  type PageUser = {
    records?: User[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type PageUserVO = {
    records?: UserVO[]
    pageNumber?: number
    pageSize?: number
    totalPage?: number
    totalRow?: number
    optimizeCountQuery?: boolean
  }

  type Part = {
    contentType?: string
    name?: string
    size?: number
    inputStream?: Record<string, any>
    headerNames?: string[]
    submittedFileName?: string
  }

  type ReadListener = true

  type ServerSentEventString = true

  type ServletConnection = {
    protocol?: string
    connectionId?: string
    secure?: boolean
    protocolConnectionId?: string
  }

  type ServletContext = {
    classLoader?: {
      name?: string
      registeredAsParallelCapable?: boolean
      parent?: {
        name?: string
        registeredAsParallelCapable?: boolean
        unnamedModule?: {
          name?: string
          descriptor?: { open?: boolean; automatic?: boolean }
          named?: boolean
          annotations?: Record<string, any>[]
          declaredAnnotations?: Record<string, any>[]
          packages?: string[]
          nativeAccessEnabled?: boolean
          layer?: Record<string, any>
        }
        definedPackages?: {
          name?: string
          annotations?: Record<string, any>[]
          declaredAnnotations?: Record<string, any>[]
          sealed?: boolean
          specificationTitle?: string
          specificationVersion?: string
          specificationVendor?: string
          implementationTitle?: string
          implementationVersion?: string
          implementationVendor?: string
        }[]
        defaultAssertionStatus?: boolean
      }
      unnamedModule?: {
        name?: string
        descriptor?: { open?: boolean; automatic?: boolean }
        named?: boolean
        annotations?: Record<string, any>[]
        declaredAnnotations?: Record<string, any>[]
        packages?: string[]
        nativeAccessEnabled?: boolean
        layer?: Record<string, any>
      }
      definedPackages?: {
        name?: string
        annotations?: Record<string, any>[]
        declaredAnnotations?: Record<string, any>[]
        sealed?: boolean
        specificationTitle?: string
        specificationVersion?: string
        specificationVendor?: string
        implementationTitle?: string
        implementationVersion?: string
        implementationVendor?: string
      }[]
      defaultAssertionStatus?: boolean
    }
    majorVersion?: number
    minorVersion?: number
    attributeNames?: Record<string, any>
    contextPath?: string
    initParameterNames?: Record<string, any>
    effectiveMajorVersion?: number
    effectiveMinorVersion?: number
    servletContextName?: string
    servletRegistrations?: Record<string, any>
    sessionTrackingModes?: ('COOKIE' | 'URL' | 'SSL')[]
    virtualServerName?: string
    jspConfigDescriptor?: JspConfigDescriptor
    filterRegistrations?: Record<string, any>
    sessionCookieConfig?: SessionCookieConfig
    effectiveSessionTrackingModes?: ('COOKIE' | 'URL' | 'SSL')[]
    responseCharacterEncoding?: string
    requestCharacterEncoding?: string
    defaultSessionTrackingModes?: ('COOKIE' | 'URL' | 'SSL')[]
    sessionTimeout?: number
    serverInfo?: string
  }

  type ServletInputStream = {
    finished?: boolean
    ready?: boolean
    readListener?: ReadListener
  }

  type ServletOutputStream = {
    ready?: boolean
    writeListener?: WriteListener
  }

  type ServletRegistration = {
    mappings?: string[]
    runAsRole?: string
    name?: string
    className?: string
    initParameters?: Record<string, any>
  }

  type ServletRequest = {
    localName?: string
    localPort?: number
    contentType?: string
    scheme?: string
    inputStream?: ServletInputStream
    protocol?: string
    locale?: {
      language?: string
      displayName?: string
      country?: string
      variant?: string
      script?: string
      unicodeLocaleAttributes?: string[]
      unicodeLocaleKeys?: string[]
      displayLanguage?: string
      displayScript?: string
      displayCountry?: string
      displayVariant?: string
      extensionKeys?: string[]
      iso3Language?: string
      iso3Country?: string
    }
    contentLength?: number
    attributeNames?: Record<string, any>
    reader?: Record<string, any>
    contentLengthLong?: number
    servletContext?: ServletContext
    parameterNames?: Record<string, any>
    locales?: Record<string, any>
    secure?: boolean
    protocolRequestId?: string
    servletConnection?: ServletConnection
    characterEncoding?: string
    serverPort?: number
    remoteHost?: string
    remoteAddr?: string
    remotePort?: number
    asyncSupported?: boolean
    localAddr?: string
    dispatcherType?: 'FORWARD' | 'INCLUDE' | 'REQUEST' | 'ASYNC' | 'ERROR'
    asyncContext?: AsyncContext
    asyncStarted?: boolean
    serverName?: string
    parameterMap?: Record<string, any>
    requestId?: string
  }

  type ServletResponse = {
    contentType?: string
    outputStream?: ServletOutputStream
    locale?: {
      language?: string
      displayName?: string
      country?: string
      variant?: string
      script?: string
      unicodeLocaleAttributes?: string[]
      unicodeLocaleKeys?: string[]
      displayLanguage?: string
      displayScript?: string
      displayCountry?: string
      displayVariant?: string
      extensionKeys?: string[]
      iso3Language?: string
      iso3Country?: string
    }
    contentLength?: number
    bufferSize?: number
    writer?: Record<string, any>
    characterEncoding?: string
    contentLengthLong?: number
    committed?: boolean
  }

  type SessionCookieConfig = {
    domain?: string
    maxAge?: number
    name?: string
    path?: string
    attributes?: Record<string, any>
    comment?: string
    secure?: boolean
    httpOnly?: boolean
  }

  type TaglibDescriptor = {
    taglibURI?: string
    taglibLocation?: string
  }

  type User = {
    id?: number
    userAccount?: string
    userPassword?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    editTime?: string
    createTime?: string
    updateTime?: string
    isDelete?: number
  }

  type UserLoginRequest = {
    userAccount?: string
    userPassword?: string
  }

  type UserRegisterRequest = {
    userAccount?: string
    userPassword?: string
    checkPassword?: string
  }

  type UserUpdatePwdRequest = {
    id?: number
    userPassword?: string
    checkPassword?: string
  }

  type UserUpdateRequest = {
    id?: number
    userName?: string
    userAvatar?: string
    userProfile?: string
  }

  type UserVO = {
    id?: number
    userAccount?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
  }

  type WriteListener = true
}
