// User types synced with backend User entity

export type Role = "ADMINISTRATOR" | "STANDARD";
export type Language = "en-US" | "sl-SI";

export interface User {
	id: number;
	email: string;
	username: string | null;
	name: string | null;
	role: Role;
	language: Language;
	created_at: string;
	updated_at: string;
}

// For PATCH /users/:id (no password field)
export interface UpdateUserDto {
	email?: string;
	username?: string | null;
	name?: string | null;
	role?: Role;
	language?: Language;
}
