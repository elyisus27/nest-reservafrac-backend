export interface PayloadInterface {
    id: number;
    username: string;
    email: string;
    profiles: payloadProfile[];
}

export interface payloadProfile {
    profileId: number,
    profileName: string
}