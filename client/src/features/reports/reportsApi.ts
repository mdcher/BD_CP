import {
	useQuery,
	type UseQueryResult,
} from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
	Debtor,
	FinancialSummary,
	AuthorRating,
	GenrePopularity,
	ReadingStatistic,
	TopReader,
} from "./types";

// Helper function to handle the response correctly considering the axios interceptor
const getData = async <T>(url: string): Promise<T> => {
	// Axios interceptor in lib/axios.ts already unwraps 'response.data.data' into 'response.data'
	// So response.data IS the data we need.
	const response = await apiClient.get<any>(url);
	return response.data as T;
};

const getDebtorsReport = async (): Promise<Array<Debtor>> => {
	const data = await getData<Array<Debtor>>("/reports/debtors");
	return data || [];
};

const getFinancialSummary = async (): Promise<FinancialSummary | null> => {
	const data = await getData<FinancialSummary>("/reports/financial-summary");
	return data || null;
};

const getAuthorRatings = async (): Promise<Array<AuthorRating>> => {
	const data = await getData<Array<AuthorRating>>("/reports/author-ratings");
	return data || [];
};

const getGenrePopularity = async (): Promise<Array<GenrePopularity>> => {
	const data = await getData<Array<GenrePopularity>>("/reports/genre-popularity");
	return data || [];
};

const getReadingStatistics = async (): Promise<Array<ReadingStatistic>> => {
	const data = await getData<Array<ReadingStatistic>>("/reports/reading-statistics");
	return data || [];
};

const getTopReaders = async (limit: number = 10): Promise<Array<TopReader>> => {
	const data = await getData<Array<TopReader>>(`/reports/top-readers?limit=${limit}`);
	return data || [];
};

export const useDebtorsReport = (): UseQueryResult<Array<Debtor>, Error> => {
	return useQuery<Array<Debtor>, Error>({
		queryKey: ["reports", "debtors"],
		queryFn: getDebtorsReport,
	});
};

export const useFinancialSummary = (): UseQueryResult<FinancialSummary | null, Error> => {
	return useQuery<FinancialSummary | null, Error>({
		queryKey: ["reports", "financial-summary"],
		queryFn: getFinancialSummary,
	});
};

export const useAuthorRatings = (): UseQueryResult<Array<AuthorRating>, Error> => {
	return useQuery<Array<AuthorRating>, Error>({
		queryKey: ["reports", "author-ratings"],
		queryFn: getAuthorRatings,
	});
};

export const useGenrePopularity = (): UseQueryResult<Array<GenrePopularity>, Error> => {
	return useQuery<Array<GenrePopularity>, Error>({
		queryKey: ["reports", "genre-popularity"],
		queryFn: getGenrePopularity,
	});
};

export const useReadingStatistics = (): UseQueryResult<Array<ReadingStatistic>, Error> => {
	return useQuery<Array<ReadingStatistic>, Error>({
		queryKey: ["reports", "reading-statistics"],
		queryFn: getReadingStatistics,
	});
};

export const useTopReaders = (limit: number = 10): UseQueryResult<Array<TopReader>, Error> => {
	return useQuery<Array<TopReader>, Error>({
		queryKey: ["reports", "top-readers", limit],
		queryFn: () => getTopReaders(limit),
	});
};