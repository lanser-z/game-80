import { Item } from '../types';

// API 基础 URL
const API_BASE_URL = 'http://localhost:8080/api/v1';

// 通用响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

// 用户登录请求
export interface LoginRequest {
  platform: string;
  code?: string;
  openid?: string;
}

// 用户登录响应
export interface LoginResponse {
  user_id: number;
  total_money: number;
  max_level: number;
  token: string;
  platform: string;
}

// 用户信息
export interface UserProfile {
  user_id: number;
  total_money: number;
  max_level: number;
  region: string;
}

// 游戏进度
export interface GameProgress {
  total_money: number;
  max_level: number;
  unlocked_levels: number;
}

// 开始游戏请求
export interface StartGameRequest {
  level_id: number;
}

// 开始游戏响应
export interface StartGameResponse {
  session_id: string;
  level_id: number;
  budget: number;
  wall_config: string;
}

// 砸墙请求
export interface HitBlockRequest {
  session_id: string;
  block_id: string;
  item_used?: {
    item_id: string;
    count: number;
  };
}

// 砸墙响应
export interface HitBlockResponse {
  remaining_budget: number;
  can_hit: boolean;
}

// 完成关卡请求
export interface CompleteLevelRequest {
  session_id: string;
  is_success: boolean;
  remaining_budget: number;
}

// 排行榜项
export interface LeaderboardItem {
  rank: number;
  user_id: number;
  total_money?: number;
  max_level?: number;
  nickname?: string;
}

// 道具
export interface ShopItem extends Item {
}

/**
 * 获取存储的 token
 */
function getToken(): string | null {
  return localStorage.getItem('game80_token');
}

/**
 * 存储 token
 */
function setToken(token: string): void {
  localStorage.setItem('game80_token', token);
}

/**
 * 通用请求头
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * 通用 fetch 封装
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

/**
 * 用户登录
 */
export async function login(platform: string, code?: string, openid?: string): Promise<LoginResponse> {
  const response = await request<ApiResponse<LoginResponse>>(`${API_BASE_URL}/user/login`, {
    method: 'POST',
    body: JSON.stringify({ platform, code, openid }),
  });

  if (response.data?.token) {
    setToken(response.data.token);
  }

  return response.data!;
}

/**
 * 获取用户信息
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await request<ApiResponse<UserProfile>>(`${API_BASE_URL}/user/profile`);
  return response.data!;
}

/**
 * 更新用户地区
 */
export async function updateUserRegion(region: string): Promise<void> {
  await request<ApiResponse<null>>(`${API_BASE_URL}/user/region`, {
    method: 'PUT',
    body: JSON.stringify({ region }),
  });
}

/**
 * 获取游戏进度
 */
export async function getGameProgress(): Promise<GameProgress> {
  const response = await request<ApiResponse<GameProgress>>(`${API_BASE_URL}/game/progress`);
  return response.data!;
}

/**
 * 开始关卡
 */
export async function startGame(levelId: number): Promise<StartGameResponse> {
  const response = await request<ApiResponse<StartGameResponse>>(`${API_BASE_URL}/game/start`, {
    method: 'POST',
    body: JSON.stringify({ level_id: levelId }),
  });
  return response.data!;
}

/**
 * 砸墙
 */
export async function hitBlock(sessionId: string, blockId: string): Promise<HitBlockResponse> {
  const response = await request<ApiResponse<HitBlockResponse>>(`${API_BASE_URL}/game/hit`, {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, block_id: blockId }),
  });
  return response.data!;
}

/**
 * 完成关卡
 */
export async function completeLevel(
  sessionId: string,
  isSuccess: boolean,
  remainingBudget: number
): Promise<{ remaining_budget: number; money_added: number; new_level_unlocked: number }> {
  const response = await request<ApiResponse<any>>(`${API_BASE_URL}/game/complete`, {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      is_success: isSuccess,
      remaining_budget: remainingBudget
    }),
  });
  return response.data!;
}

/**
 * 获取区域排行榜
 */
export async function getRegionLeaderboard(region: string = 'all', limit: number = 100): Promise<LeaderboardItem[]> {
  const response = await request<ApiResponse<{ rankings: LeaderboardItem[] }>>(
    `${API_BASE_URL}/leaderboard/region?region=${region}&limit=${limit}`
  );
  return response.data?.rankings || [];
}

/**
 * 获取全局通关数排行榜
 */
export async function getGlobalLevelLeaderboard(): Promise<LeaderboardItem[]> {
  const response = await request<ApiResponse<{ rankings: LeaderboardItem[] }>>(
    `${API_BASE_URL}/leaderboard/global/level`
  );
  return response.data?.rankings || [];
}

/**
 * 获取全局私房钱排行榜
 */
export async function getGlobalMoneyLeaderboard(): Promise<LeaderboardItem[]> {
  const response = await request<ApiResponse<{ rankings: LeaderboardItem[] }>>(
    `${API_BASE_URL}/leaderboard/global/money`
  );
  return response.data?.rankings || [];
}

/**
 * 获取商店道具列表
 */
export async function getShopItems(): Promise<ShopItem[]> {
  const response = await request<ApiResponse<{ items: ShopItem[] }>>(`${API_BASE_URL}/shop/items`);
  return response.data?.items || [];
}

/**
 * 购买道具
 */
export async function buyItem(itemId: string, quantity: number): Promise<{
  item_id: string;
  quantity: number;
  total_price: number;
  remaining_money: number;
}> {
  const response = await request<ApiResponse<any>>(`${API_BASE_URL}/shop/buy`, {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, quantity }),
  });
  return response.data!;
}

/**
 * 获取道具库存
 */
export async function getInventory(): Promise<{ item_id: string; quantity: number }[]> {
  const response = await request<ApiResponse<{ inventory: { item_id: string; quantity: number }[] }>>(
    `${API_BASE_URL}/shop/inventory`
  );
  return response.data?.inventory || [];
}
