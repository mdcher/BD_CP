import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useUsers, useDeleteUser } from "@/features/users/usersApi";

function UsersPage(): React.JSX.Element {
	const { data: users, isLoading, isError } = useUsers();
	const deleteUserMutation = useDeleteUser();

	const handleDelete = (id: number): void => {
		if (confirm("Ви впевнені, що хочете видалити цього користувача?")) {
			deleteUserMutation.mutate(id.toString());
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
				Failed to load users. You may not have permission to view this page.
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-800">Користувачі</h1>
					<p className="mt-1 text-sm text-gray-600">
						Всього користувачів: {users?.length || 0}
					</p>
				</div>
			</div>

			{/* Users Table */}
			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								ID
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Email
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Username
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Name
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Role
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								Language
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
								Дії
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white">
						{users && users.length > 0 ? (
							users.map((user) => (
								<tr
									key={user.id}
									className="transition-colors hover:bg-gray-50"
								>
									<td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
										{user.id}
									</td>
									<td className="px-6 py-4 text-sm text-gray-900">
										{user.email}
									</td>
									<td className="px-6 py-4 text-sm text-gray-900">
										{user.username || "-"}
									</td>
									<td className="px-6 py-4 text-sm text-gray-900">
										{user.name || "-"}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{user.role === "ADMINISTRATOR" ? (
											<span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold leading-5 text-purple-800">
												Admin
											</span>
										) : (
											<span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold leading-5 text-gray-800">
												Standard
											</span>
										)}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
										{user.language}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
										<div className="flex justify-end gap-2">
											<Link
												to="/users/$userId"
												params={{ userId: user.id.toString() }}
												className="text-indigo-600 hover:text-indigo-900"
											>
												Редагувати
											</Link>
											<button
												onClick={() => handleDelete(user.id)}
												disabled={deleteUserMutation.isPending}
												className="text-red-600 hover:text-red-900 disabled:opacity-50"
											>
												Видалити
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={7} className="px-6 py-12 text-center">
									<div className="text-gray-500">
										<p className="text-lg font-medium">Користувачів не знайдено</p>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/users")({
	component: UsersPage,
});
