import { Comment } from "../@types/comment";

// A post request should not contain an id.
export type CommentCreationParams = Pick<Comment, "email" | "name" | "phoneNumbers">;

export class CommentService {
    public get(id: number, name?: string): Comment {
        return {
            id,
            email: "jane@doe.com",
            name: name ?? "Jane Doe",
            status: "Happy",
            phoneNumbers: [],
        };
    }

    public create(userCreationParams: CommentCreationParams): Comment {
        return {
            id: Math.floor(Math.random() * 10000), // Random
            status: "Happy",
            ...userCreationParams,
        };
    }
}