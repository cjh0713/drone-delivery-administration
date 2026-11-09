import request from '@/utils/request'

export const getOrderListApi = (params) => {
  return request.get('/order/list', { params })
}

export const getOrderDetailApi = (id) => {
  return request.get(`/order/${id}`)
}

export const createOrderApi = (data) => {
  return request.post('/order/create', data)
}

export const cancelOrderApi = (id) => {
  return request.put(`/order/${id}/cancel`)
}

export const restoreOrderApi = (id) => {
  return request.put(`/order/${id}/restore`)
}

export const estimatePriceApi = (params) => {
  return request.get('/order/price', { params })
}
