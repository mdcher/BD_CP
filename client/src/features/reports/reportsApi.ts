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

const getDebtorsReport = async (): Promise<Array<Debtor>> => {
	const response = await apiClient.get<{ message: string; data: Array<Debtor> }>("/reports/debtors");
	return response.data;
};

const getFinancialSummary = async (): Promise<FinancialSummary> => {
	const response = await apiClient.get<{ message: string; data: FinancialSummary }>("/reports/financial-summary");
	return response.data;
};

const getAuthorRatings = async (): Promise<Array<AuthorRating>> => {
	const response = await apiClient.get<{ message: string; data: Array<AuthorRating> }>("/reports/author-ratings");
	return response.data;
};

const getGenrePopularity = async (): Promise<Array<GenrePopularity>> => {
	const response = await apiClient.get<{ message: string; data: Array<GenrePopularity> }>("/reports/genre-popularity");
	return response.data;
};

const getReadingStatistics = async (): Promise<Array<ReadingStatistic>> => {
	const response = await apiClient.get<{ message: string; data: Array<ReadingStatistic> }>("/reports/reading-statistics");
	return response.data;
};

const getTopReaders = async (limit: number = 10): Promise<Array<TopReader>> => {
	const response = await apiClient.get<{ message: string; data: Array<TopReader> }>(
		`/reports/top-readers?limit=${limit}`
	);
	return response.data;
};

export const useDebtorsReport = (): UseQueryResult<Array<Debtor>, Error> => {
	return useQuery<Array<Debtor>, Error>({
		queryKey: ["reports", "debtors"],
		queryFn: getDebtorsReport,
	});
};

export const useFinancialSummary = (): UseQueryResult<FinancialSummary, Error> => {
	return useQuery<FinancialSummary, Error>({
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
