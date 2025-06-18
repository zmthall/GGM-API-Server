export type JobDescription = {
    id: string;
    description: string;
    qualifications: string | string[];
    responsbilities: string | string[];
    select: string;
    shifts: string | string[];
    title: string;
}

export type JobDescriptions = JobDescription[];

