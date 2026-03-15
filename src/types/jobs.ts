export type JobDescription = {
    id: string;
    description: string;
    qualifications: string | string[];
    responsibilities: string | string[];
    select_label: string;
    shifts: string | string[];
    title: string;
}

export type JobDescriptions = JobDescription[];

