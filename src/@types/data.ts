export type Comment = {
    id: number;
    post: Post;
}

export type Post = {
    id: number;
    comments: Comment[]
}