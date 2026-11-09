import request from '@/utils/request'

export const getAreaStatisticsApi = () => {
  return request.get('/statistics/area')
}

export const getOverviewStatisticsApi = () => {
  return request.get('/statistics/overview')
}

export const getCargoStatisticsApi = () => {
  return request.get('/statistics/cargo')
}

export const getTrendStatisticsApi = (params) => {
  return request.get('/statistics/trend', { params })
}

export const getWeatherStatisticsApi = () => {
  return request.get('/statistics/weather', { silent: true })
}
