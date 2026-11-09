import request from '@/utils/request'

export const planRouteApi = (data) => {
  return request.post('/route/plan', data)
}

export const getNoFlyZonesApi = () => {
  return request.get('/route/zones')
}

export const getWeatherApi = (params) => {
  return request.get('/route/weather', { params })
}
