import { sharedConstant } from './constants.js'

export const API_URL = `https://api.example.com/${sharedConstant}`

export const ENDPOINTS = {
  users: '/users',
  posts: '/posts'
} as const