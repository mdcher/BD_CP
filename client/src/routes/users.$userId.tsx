import type * as React from "react";
import { useEffect } from "react";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser, useUpdateUser } from "@/features/users/usersApi";
import type { UpdateUserDto, Role, Language } from "@/features/users/types";

// Zod schema for user update
const updateUserSchema = z.object({
	email: z.string().email("Невірний формат email").optional(),
	username: z.string().optional(),
	name: z.string().optional(),
	role: z.enum(["ADMINISTRATOR", "STANDARD"]).optional(),
	language: z.enum(["en-US", "sl-SI"]).optional(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

function EditUserPage(): React.JSX.Element {
	const { userId } = useParams({ from: "/users/$userId" });
	const navigate = useNavigate();
	const { data: user, isLoading, isError } = useUser(userId);
	const updateUserMutation = useUpdateUser();

	// const {
	// 	register,
	// 	handleSubmit,
	// 	formState: { errors },
	// 	reset,
	// } = useForm<UpdateUserDto>({
	// 	// resolver: zodResolver(updateUserSchema),
	// });

	useEffect(() => {
		if (user) {
			reset({
				email: user.email,
				username: user.username || "",
				name: user.name || "",
				role: user.role,
				language: user.language,
			});
		}
	}, [user, reset]);

	const onSubmit = (data: UpdateUserForm): void => {
		const payload: UpdateUserDto = {
			email: data.email,
			username: data.username || null,
			name: data.name || null,
			role: data.role as Role,
			language: data.language as Language,
		};
		updateUserMutation.mutate({ id: userId, data: payload });
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (isError || !user) {
		return (
			<div className="container mx-auto p-4">
				<div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
					User not found or failed to load.
				</div>
			</div>
		);
	}

	const inputClass =
		"w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
	const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
	const errorClass = "mt-1 text-xs text-red-500";

	return (
		<div className="container mx-auto max-w-3xl p-4">
			<div className="mb-6">
				<button
					className="mb-4 text-blue-500 hover:text-blue-600"
					type="button"
					onClick={() => {
						void navigate({ to: "/users" });
					}}
				>
					← Back to Users
				</button>
				<h1 className="text-3xl font-bold text-gray-800">
					Edit User: {user.email}
				</h1>
			</div>

			<form
				className="space-y-6 rounded-lg bg-white p-6 shadow-md"
				onSubmit={handleSubmit(onSubmit)}
			>
				{/* Email */}
				<div>
					<label className={labelClass} htmlFor="email">
						Email *
					</label>
					<input
						{...register("email")}
						id="email"
						type="email"
						className={inputClass}
					/>
					{errors.email && (
						<p className={errorClass}>{errors.email.message}</p>
					)}
				</div>

				{/* Username and Name */}
				<div className="grid gap-6 md:grid-cols-2">
					<div>
						<label className={labelClass} htmlFor="username">
							Username
						</label>
						<input
							{...register("username")}
							id="username"
							type="text"
							className={inputClass}
						/>
						{errors.username && (
							<p className={errorClass}>{errors.username.message}</p>
						)}
					</div>
					<div>
						<label className={labelClass} htmlFor="name">
							Name
						</label>
						<input
							{...register("name")}
							id="name"
							type="text"
							className={inputClass}
						/>
						{errors.name && (
							<p className={errorClass}>{errors.name.message}</p>
						)}
					</div>
				</div>

				{/* Role and Language */}
				<div className="grid gap-6 md:grid-cols-2">
					<div>
						<label className={labelClass} htmlFor="role">
							Role *
						</label>
						<select
							{...register("role")}
							id="role"
							className={inputClass}
						>
							<option value="STANDARD">Standard</option>
							<option value="ADMINISTRATOR">Administrator</option>
						</select>
						{errors.role && (
							<p className={errorClass}>{errors.role.message}</p>
						)}
					</div>
					<div>
						<label className={labelClass} htmlFor="language">
							Language *
						</label>
						<select
							{...register("language")}
							id="language"
							className={inputClass}
						>
							<option value="en-US">English (US)</option>
							<option value="sl-SI">Slovenian</option>
						</select>
						{errors.language && (
							<p className={errorClass}>{errors.language.message}</p>
						)}
					</div>
				</div>

				{/* User Info */}
				<div className="border-t pt-4">
					<h3 className="mb-3 text-lg font-semibold">User Information</h3>
					<div className="space-y-2 text-sm text-gray-600">
						<p>
							<span className="font-medium">User ID:</span> {user.id}
						</p>
						<p>
							<span className="font-medium">Created:</span>{" "}
							{new Date(user.created_at).toLocaleString()}
						</p>
						<p>
							<span className="font-medium">Last Updated:</span>{" "}
							{new Date(user.updated_at).toLocaleString()}
						</p>
					</div>
				</div>

				{/* Buttons */}
				<div className="flex gap-4">
					<button
						className="flex-1 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600 disabled:bg-gray-400"
						disabled={updateUserMutation.isPending}
						type="submit"
					>
						{updateUserMutation.isPending ? "Saving..." : "Save Changes"}
					</button>
					<button
						className="rounded-lg border border-gray-300 px-6 py-3 transition-colors hover:bg-gray-50"
						type="button"
						onClick={() => {
							void navigate({ to: "/users" });
						}}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}

export const Route = createFileRoute("/users/$userId")({
	component: EditUserPage,
});
