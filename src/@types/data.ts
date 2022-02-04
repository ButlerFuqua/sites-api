import { SiteDb } from "../persistance/SiteDb"

export type Comment = {
    displayName?: string,
    body: string,
    phoneNumber: string,
    post: Post;
}

export type Post = {
    body: string,
    site: SiteDb,
    comments: Comment[]
}

export type Site = {
    phoneNumber: string,
    unique: string,
    title?: string,
    owner?: string,
    about?: string,
    support?: string,
    account?: Account,
    posts?: Post[],
    phoneSubscribers?: PhoneSubscriber[],
    emailSubscribers?: EmailSubscriber[],
    stagedForDeletion: boolean,
    inNetwork: boolean,
}

export type Account = {
    name: { type: String, required: true, unique: true, },
    paid: { type: Boolean, required: true, },
    paymentLink: { type: String },
    features: any[]
};

export type PhoneSubscriber = {
    phoneNumber: string,
    sites: Site[],
};

export type EmailSubscriber = {
    email: string,
    sites: Site[],
};

export type BlacklistUnique = {
    name: string,
};

export type Command = {
    name: string,
    desc: string,
    example: string,
    updateCommand: boolean,
    param?: string,
};

export type Log = {
    type: string,
    message: string,
    data: any,
};