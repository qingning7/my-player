import { HttpException, Injectable } from '@nestjs/common';

type QueryValue = string | string[] | undefined;

@Injectable()
export class NeteaseService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NETEASE_API_BASE ?? 'http://localhost:3001';
  }

  async get(path: string, query: Record<string, QueryValue>) {
    const url = new URL(path, this.baseUrl);

    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => url.searchParams.append(key, entry));
        return;
      }
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString());
    const contentType = response.headers.get('content-type') ?? '';
    const raw = await response.text();
    const data = contentType.includes('application/json') ? JSON.parse(raw) : raw;

    if (!response.ok) {
      throw new HttpException(data || 'Upstream error', response.status);
    }

    return data;
  }
}
