import client from './client';

export const getMySettings = () => client.get('/me');
export const updateDiscordSettings = (data) => client.put('/me/discord', data);
