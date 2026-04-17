const API_BASE = process.env.TABLECRM_API_BASE ?? "https://app.tablecrm.com/api/v1";

type RequestOptions = {
  token: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

function toUrl({ token, path, query }: Pick<RequestOptions, "token" | "path" | "query">) {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("token", token);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function tablecrmRequest<T>({
  token,
  method = "GET",
  path,
  query,
  body,
}: RequestOptions): Promise<T> {
  const url = toUrl({ token, path, query });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`TableCRM ${method} ${path} failed: ${response.status} ${text}`);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`TableCRM ${method} ${path} returned non-JSON response: ${text}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`TableCRM ${method} ${path} timeout`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function pickId(input: any) {
  return input?.id ?? input?.idx ?? input?.uuid ?? input?.value ?? "";
}

function pickName(input: any) {
  return (
    input?.name ??
    input?.title ??
    input?.full_name ??
    input?.short_name ??
    input?.label ??
    input?.presentation ??
    `#${pickId(input)}`
  );
}

export function mapOptionsFromResponse(
  data: any,
): { id: string | number; name: string; code?: string; phone?: string; raw: unknown }[] {
  const array = Array.isArray(data)
    ? data
    : Array.isArray(data?.result)
      ? data.result
      : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];

  return array.map((item: any) => ({
    id: pickId(item),
    name: pickName(item),
    code: item?.code ?? item?.article,
    phone: item?.phone ?? item?.phone_number,
    raw: item,
  }));
}