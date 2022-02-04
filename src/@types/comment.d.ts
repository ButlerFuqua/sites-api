import { Post } from './post'


export type Comment = {
    displayName: String,
    body: any,
    phoneNumber: String,
    post: Post,
}