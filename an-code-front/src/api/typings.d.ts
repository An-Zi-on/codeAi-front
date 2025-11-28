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
    urlPatternMappings?: string[]
    servletNameMappings?: string[]
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
    session?: HttpSession
    remoteUser?: string
    headerNames?: Record<string, any>
    userPrincipal?: { name?: string }
    authType?: string
    requestURI?: string
    pathTranslated?: string
    queryString?: string
    pathInfo?: string
    servletPath?: string
    trailerFields?: Record<string, any>
    requestURL?: { length?: number; empty?: boolean }
    requestedSessionId?: string
    requestedSessionIdValid?: boolean
    trailerFieldsReady?: boolean
    httpServletMapping?: HttpServletMapping
    requestedSessionIdFromURL?: boolean
    requestedSessionIdFromCookie?: boolean
    parts?: Part[]
    cookies?: Cookie[]
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
    contentLengthLong?: number
    attributeNames?: Record<string, any>
    servletContext?: ServletContext
    reader?: Record<string, any>
    parameterNames?: Record<string, any>
    protocolRequestId?: string
    characterEncoding?: string
    servletConnection?: ServletConnection
    secure?: boolean
    locales?: Record<string, any>
    dispatcherType?: 'FORWARD' | 'INCLUDE' | 'REQUEST' | 'ASYNC' | 'ERROR'
    requestId?: string
    serverPort?: number
    remoteHost?: string
    localAddr?: string
    asyncStarted?: boolean
    parameterMap?: Record<string, any>
    serverName?: string
    remoteAddr?: string
    remotePort?: number
    asyncSupported?: boolean
    asyncContext?: AsyncContext
  }

  type HttpSession = {
    id?: string
    creationTime?: number
    attributeNames?: Record<string, any>
    servletContext?: ServletContext
    lastAccessedTime?: number
    maxInactiveInterval?: number
    new?: boolean
  }

  type JspConfigDescriptor = {
    jspPropertyGroups?: JspPropertyGroupDescriptor[]
    taglibs?: TaglibDescriptor[]
  }

  type JspPropertyGroupDescriptor = {
    buffer?: string
    defaultContentType?: string
    urlPatterns?: string[]
    isXml?: string
    deferredSyntaxAllowedAsLiteral?: string
    errorOnUndeclaredNamespace?: string
    trimDirectiveWhitespaces?: string
    includeCodas?: string[]
    includePreludes?: string[]
    elIgnored?: string
    pageEncoding?: string
    errorOnELNotFound?: string
    scriptingInvalid?: string
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
    connectionId?: string
    protocol?: string
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
    requestCharacterEncoding?: string
    effectiveSessionTrackingModes?: ('COOKIE' | 'URL' | 'SSL')[]
    defaultSessionTrackingModes?: ('COOKIE' | 'URL' | 'SSL')[]
    responseCharacterEncoding?: string
    sessionTimeout?: number
    serverInfo?: string
    initParameterNames?: Record<string, any>
    filterRegistrations?: Record<string, any>
    jspConfigDescriptor?: JspConfigDescriptor
    virtualServerName?: string
    servletRegistrations?: Record<string, any>
    effectiveMajorVersion?: number
    sessionCookieConfig?: SessionCookieConfig
    sessionTrackingModes?: ('COOKIE' | 'URL' | 'SSL')[]
    effectiveMinorVersion?: number
    servletContextName?: string
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
    contentLengthLong?: number
    attributeNames?: Record<string, any>
    servletContext?: ServletContext
    reader?: Record<string, any>
    parameterNames?: Record<string, any>
    protocolRequestId?: string
    characterEncoding?: string
    servletConnection?: ServletConnection
    secure?: boolean
    locales?: Record<string, any>
    dispatcherType?: 'FORWARD' | 'INCLUDE' | 'REQUEST' | 'ASYNC' | 'ERROR'
    requestId?: string
    serverPort?: number
    remoteHost?: string
    localAddr?: string
    asyncStarted?: boolean
    parameterMap?: Record<string, any>
    serverName?: string
    remoteAddr?: string
    remotePort?: number
    asyncSupported?: boolean
    asyncContext?: AsyncContext
  }

  type ServletResponse = {
    contentType?: string
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
    outputStream?: ServletOutputStream
    contentLength?: number
    bufferSize?: number
    contentLengthLong?: number
    characterEncoding?: string
    writer?: Record<string, any>
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
