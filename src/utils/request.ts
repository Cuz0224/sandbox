// 统一的代理请求方法
export const proxyRequest = async (endpoint: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  bodys?: any;
  isFormData?: boolean;
} = {}) => {
  const {
    method = 'GET', 
    headers = {},
    bodys = null,
    isFormData = false
  } = options;

  // 构建完整的URL
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${endpoint}`;
  
  // 准备请求体
  let requestBody = bodys;
  if (isFormData && bodys instanceof FormData) {
    // 对于FormData，转换为普通对象
    requestBody = Object.fromEntries(bodys.entries());
  }

  // 构建代理请求的配置
  const proxyConfig = {
    url: fullUrl,
    method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Authorization': 'autopilot123456',
      ...(isFormData && { 'Content-Type': 'multipart/form-data' })
    },
    bodys: requestBody || undefined,
  };

  // 发送代理请求
  const response = await fetch('https://autopilottest.koudingvip.com/api/zaki/proxy/', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Authorization': 'autopilot123456',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(proxyConfig)
  });
  return response;
};
