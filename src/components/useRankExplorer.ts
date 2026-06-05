"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyFilters, type RankFilterState, type ResultSelection } from "@/components/rankTypes";
import { sameEntry } from "@/lib/resultLinks";
import type { ResultDetailResponse, ResultEntry, ResultListResponse } from "@/lib/types";

const defaultPageSize = 25;
const debounceMs = 300;

export function useRankExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialState = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  const [filters, setFilters] = useState<RankFilterState>(initialState.filters);
  const [searchValue, setSearchValue] = useState(initialState.filters.q);
  const [page, setPage] = useState(initialState.page);
  const [pageSize, setPageSize] = useState(initialState.pageSize);
  const [selected, setSelected] = useState<ResultSelection | null>(initialState.selected);
  const [data, setData] = useState<ResultListResponse | null>(null);
  const [detail, setDetail] = useState<ResultDetailResponse | null>(null);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [isListLoading, setListLoading] = useState(true);
  const [isDetailLoading, setDetailLoading] = useState(false);
  const [listRetryKey, setListRetryKey] = useState(0);
  const [detailRetryKey, setDetailRetryKey] = useState(0);
  const debouncedSearch = useDebouncedValue(searchValue, debounceMs);
  const lastHref = useRef("");
  const lastDebouncedSearch = useRef(debouncedSearch);

  useEffect(() => {
    if (lastDebouncedSearch.current === debouncedSearch) return;
    lastDebouncedSearch.current = debouncedSearch;
    setPage(1);
    setSelected(null);
    setFilters((current) => (current.q === debouncedSearch ? current : { ...current, q: debouncedSearch }));
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    setListLoading(true);
    fetch(`/api/results?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res, "数据加载失败"));
        return res.json();
      })
      .then((body: ResultListResponse) => {
        const nextTotalPages = Math.max(1, Math.ceil(body.total / (body.pageSize || pageSize)));
        setData(body);
        setListError("");
        if (page > nextTotalPages) setPage(nextTotalPages);
        setSelected((current) => current ?? selectionFromEntry(body.results[0] ?? null));
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setListError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });

    return () => controller.abort();
  }, [filters, page, pageSize, listRetryKey]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setDetailError("");
      setDetailLoading(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ division: selected.divisionCode });
    setDetailLoading(true);
    setDetailError("");
    fetch(`/api/results/${encodeURIComponent(selected.bib)}?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res, "详情加载失败"));
        return res.json();
      })
      .then((body: ResultDetailResponse) => {
        setDetail(body);
        setDetailError("");
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setDetail(null);
          setDetailError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [selected, detailRetryKey]);

  useEffect(() => {
    const nextHref = buildExplorerHref(filters, page, pageSize, selected);
    if (lastHref.current === nextHref) return;
    lastHref.current = nextHref;
    router.replace(nextHref, { scroll: false });
  }, [filters, page, pageSize, router, selected]);

  const options = useMemo(() => data?.filters ?? { groups: [], projects: [], divisions: [] }, [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const selectedEntry = useMemo(() => {
    if (!selected) return detail?.result ?? null;
    return data?.results.find((entry) => sameEntry(entry, selected)) ?? detail?.result ?? null;
  }, [data?.results, detail?.result, selected]);

  const updateFilter = useCallback((key: keyof RankFilterState, value: string) => {
    setPage(1);
    setSelected(null);
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchValue("");
    setPage(1);
    setSelected(null);
    setFilters(emptyFilters);
  }, []);

  const updatePageSize = useCallback((value: string) => {
    setPageSize(Number(value));
    setPage(1);
  }, []);

  const selectEntry = useCallback((entry: ResultEntry) => {
    setSelected(selectionFromEntry(entry));
  }, []);

  return {
    data,
    detail,
    detailError,
    filters,
    isDetailLoading,
    isListLoading,
    listError,
    options,
    page,
    pageEnd,
    pageSize,
    pageStart,
    resetFilters,
    retryDetail: () => setDetailRetryKey((current) => current + 1),
    retryList: () => setListRetryKey((current) => current + 1),
    searchValue,
    selected,
    selectedEntry,
    selectEntry,
    setPage,
    setSearchValue,
    total,
    totalPages,
    updateFilter,
    updatePageSize,
  };
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

function parseSearchParams(params: { get(name: string): string | null }): {
  filters: RankFilterState;
  page: number;
  pageSize: number;
  selected: ResultSelection | null;
} {
  const selectedBib = params.get("bib")?.trim() ?? "";
  const selectedDivision = params.get("athleteDivision")?.trim() ?? "";

  return {
    filters: {
      q: params.get("q")?.trim() ?? "",
      group: params.get("group")?.trim() ?? "",
      project: params.get("project")?.trim() ?? "",
      division: params.get("division")?.trim() ?? "",
      status: params.get("status")?.trim() ?? "",
    },
    page: positiveInt(params.get("page"), 1),
    pageSize: clampPageSize(positiveInt(params.get("pageSize"), defaultPageSize)),
    selected: selectedBib && selectedDivision ? { bib: selectedBib, divisionCode: selectedDivision } : null,
  };
}

function buildExplorerHref(filters: RankFilterState, page: number, pageSize: number, selected: ResultSelection | null): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  if (pageSize !== defaultPageSize) params.set("pageSize", String(pageSize));
  if (selected) {
    params.set("bib", selected.bib);
    params.set("athleteDivision", selected.divisionCode);
  }
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function selectionFromEntry(entry: ResultEntry | null): ResultSelection | null {
  return entry ? { bib: entry.bib, divisionCode: entry.divisionCode } : null;
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clampPageSize(value: number): number {
  return [25, 50, 100].includes(value) ? value : defaultPageSize;
}

async function responseError(res: Response, fallback: string) {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}
