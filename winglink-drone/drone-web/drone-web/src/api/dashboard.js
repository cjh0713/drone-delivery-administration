import request from '@/utils/request'

export const getSummaryApi = () => {
  return request.get('/dashboard/summary')
}

export const getTrendApi = (params) => {
  return request.get('/dashboard/trend', { params })
}

export const getHeatmapApi = () => {
  return request.get('/dashboard/heatmap')
}

export const getDroneStatusApi = () => {
  return request.get('/dashboard/drones')
}
