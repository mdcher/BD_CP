export interface Genre {
	id: number;
	genrename: string;
}

export interface CreateGenreDto {
	genrename: string;
}

export interface UpdateGenreDto {
	genrename: string;
}
