export interface Employee {
	employeeid: number;
	userid: number;
	position: string;
	salaryrate: number;
	workedhours: number;
	calculatedsalary: number;
	fullname?: string;
	contactinfo?: string;
	role?: string;
}

export interface CreateEmployeeDto {
	userid: number;
	position: string;
	salaryrate: number;
	workedhours: number;
}

export interface UpdateEmployeeDto {
	position?: string;
	salaryrate?: number;
	workedhours?: number;
}
