import request from '@/utils/request'

export const getArticleListApi = (params) => {
  return request.get('/article/list', { params })
}

export const getArticleDetailApi = (id) => {
  return request.get(`/article/${id}`)
}

export const likeArticleApi = (id) => {
  return request.post(`/article/${id}/like`)
}

export const getCategoriesApi = () => {
  return request.get('/article/categories')
}
