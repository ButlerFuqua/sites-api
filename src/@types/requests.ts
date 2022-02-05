export type CreateCommentRequest = {
    phoneNumber: string;
    commentBody: string;
    displayName: string;
}

export type SignupSubscriberRequest = {
    phoneNumber?: string;
    email?: string;
}