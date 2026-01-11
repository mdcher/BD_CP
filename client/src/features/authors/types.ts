export interface Author {
	id: number;
	fullname: string;
}

export interface CreateAuthorDto {
	fullname: string;
}

export interface UpdateAuthorDto {
	fullname: string;
}
